// src/components/ModelViewer/ModelViewer.js

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { DoubleSide, Color, Vector3 } from 'three';
import BrushPreview from '../BrushPreview/BrushPreview';
import { useSelector } from 'react-redux';
import * as THREE from 'three';
import { RBush3D } from 'rbush-3d';
import throttle from 'lodash/throttle';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ModelViewer = forwardRef(
  (
    {
      modelPath,
      modelType,
      brushColor,
      brushSize,
      brushOpacity,
      onHistoryChange,
      onColorUsed,
      setIsModelSaved,
    },
    ref
  ) => {
    const meshRef = useRef();
    const [geometry, setGeometry] = useState(null);
    const [isGLTFWithColors, setIsGLTFWithColors] = useState(false);

    useEffect(() => {
      if (window.electron && window.electron.saveFile) {
        console.log("Electron saveFile is available");
      } else {
        console.error("Electron saveFile is not available");
      }
    }, []);
    
    useEffect(() => {
      let loader;
      if (modelType === 'stl') {
        loader = new STLLoader();
        loader.load(modelPath, (geom) => {
          geom.center();
          geom.computeVertexNormals();
          geom.computeBoundingSphere();  // Compute bounding volumes
          geom.computeBoundingBox();
          if (geom.boundingSphere) {
            setGeometry(geom);
          } else {
            console.warn("Bounding sphere not computed, geometry not set.");
          }
        });
      } else if (modelType === 'gltf') {
        loader = new GLTFLoader();
        loader.load(
          modelPath,
          (gltf) => {
            const child = gltf.scene.children[0];
            if (child.geometry) {
              const geom = child.geometry;
              geom.computeBoundingSphere();
              geom.computeBoundingBox();
              setGeometry(geom);
              setIsGLTFWithColors(geom.hasAttribute('color')); // Set flag based on vertex colors
            }
          },
          undefined,
          (error) => console.error("GLTF loading error:", error)
        );
      }
    }, [modelPath, modelType]);

    // Material Properties from Redux
 

    // Transformation Properties from Redux
    const { color, metalness, roughness, paintType } = useSelector((state) => state.material);
    const position = useSelector((state) => state.transform.position);
    const rotation = useSelector((state) => state.transform.rotation);
    const scale = useSelector((state) => state.transform.scale);

    const [brushPosition, setBrushPosition] = useState(new Vector3());
    const [isPainting, setIsPainting] = useState(false);
    const [rbushTree, setRbushTree] = useState(null);

    const tmpVertex = useMemo(() => new THREE.Vector3(), []);
    const inverseMatrix = useMemo(() => new THREE.Matrix4(), []);

    // History Stacks
    const history = useRef([]);
    const redoHistory = useRef([]);
    const currentAction = useRef(null);

    const triggerHistoryChange = useCallback(() => {
      if (onHistoryChange) {
        onHistoryChange(history.current.length > 0, redoHistory.current.length > 0);
      }
    }, [onHistoryChange]);

    useImperativeHandle(ref, () => ({
      undo: () => {
        if (history.current.length === 0) return;
        const lastAction = history.current.pop();
        if (lastAction && geometry && geometry.hasAttribute('color')) {
          const colorAttribute = geometry.attributes.color;
          lastAction.vertices.forEach(({ index, previousColor }) => {
            colorAttribute.setXYZ(index, previousColor.r, previousColor.g, previousColor.b);
          });
          colorAttribute.needsUpdate = true;
          redoHistory.current.push(lastAction);
          triggerHistoryChange();
          console.log('Undo performed:', lastAction);
        }
      },
      redo: () => {
        if (redoHistory.current.length === 0) return;
        const lastRedoAction = redoHistory.current.pop();
        if (lastRedoAction && geometry && geometry.hasAttribute('color')) {
          const colorAttribute = geometry.attributes.color;
          lastRedoAction.vertices.forEach(({ index, newColor }) => {
            colorAttribute.setXYZ(index, newColor.r, newColor.g, newColor.b);
          });
          colorAttribute.needsUpdate = true;
          history.current.push(lastRedoAction);
          triggerHistoryChange();
          console.log('Redo performed:', lastRedoAction);
        }
      },
      canUndo: () => history.current.length > 0,
      canRedo: () => redoHistory.current.length > 0,
      mesh: meshRef.current,
      history,
      redoHistory,
    
    }));

    useEffect(() => {
      if (geometry) {
        geometry.center();
        if (!geometry.hasAttribute('normal')) {
          geometry.computeVertexNormals();
        }
    
        // Initialize vertex colors only if they don't exist
        if (!geometry.hasAttribute('color')) {
          const colors = [];
          const defaultColor = new Color(color);
          for (let i = 0; i < geometry.attributes.position.count; i++) {
            colors.push(defaultColor.r, defaultColor.g, defaultColor.b);
          }
          geometry.setAttribute(
            'color',
            new THREE.Float32BufferAttribute(colors, 3)
          );
          geometry.attributes.color.needsUpdate = true;
        }
      }
    }, [geometry, color]);

    // Build RBush3D spatial index
    useEffect(() => {
      if (geometry) {
        try {
          const points = [];
          for (let i = 0; i < geometry.attributes.position.count; i++) {
            const vertex = new THREE.Vector3().fromBufferAttribute(
              geometry.attributes.position,
              i
            );
            points.push({
              minX: vertex.x,
              minY: vertex.y,
              minZ: vertex.z,
              maxX: vertex.x,
              maxY: vertex.y,
              maxZ: vertex.z,
              index: i,
            });
          }

          const tree = new RBush3D();
          tree.load(points);
          setRbushTree(tree);
          console.log('RBush3D spatial index built with', points.length, 'points');
        } catch (error) {
          console.error('Error building RBush3D spatial index:', error);
        }
      }
    }, [geometry]);

    // Update vertex colors when material color changes
    useEffect(() => {
      if (geometry && geometry.hasAttribute('color') && !isGLTFWithColors) {
        const colors = geometry.attributes.color.array;
        const updatedColor = new Color(color);
        for (let i = 0; i < colors.length; i += 3) {
          colors[i] = updatedColor.r;
          colors[i + 1] = updatedColor.g;
          colors[i + 2] = updatedColor.b;
        }
        geometry.attributes.color.needsUpdate = true;
        console.log('Material color updated for all vertices');
      }
    }, [color, geometry, isGLTFWithColors]);

    // Update inverse matrix whenever mesh transformation changes
    useEffect(() => {
      if (meshRef.current) {
        meshRef.current.updateMatrixWorld();
        inverseMatrix.copy(meshRef.current.matrixWorld).invert();
      }
    }, [position, rotation, scale, inverseMatrix]);

    // Painting Function with Smooth Blending and Optimizations
 // src/components/ModelViewer/ModelViewer.js

 const paint = useCallback(
  (event) => {
    if (!meshRef.current || !geometry) return;

    const colorAttribute = geometry.attributes.color;
    const intersectPoint = event.point.clone().applyMatrix4(inverseMatrix);

    const queryBox = {
      minX: intersectPoint.x - brushSize,
      minY: intersectPoint.y - brushSize,
      minZ: intersectPoint.z - brushSize,
      maxX: intersectPoint.x + brushSize,
      maxY: intersectPoint.y + brushSize,
      maxZ: intersectPoint.z + brushSize,
    };

    const nearestPoints = rbushTree.search(queryBox);
    nearestPoints.forEach((point) => {
      const i = point.index;
      tmpVertex.fromBufferAttribute(geometry.attributes.position, i);
      const distance = tmpVertex.distanceTo(intersectPoint);

      if (distance <= brushSize) {
        // Get the original color at this vertex
        const previousColor = new Color(
          colorAttribute.getX(i),
          colorAttribute.getY(i),
          colorAttribute.getZ(i)
        );

        let newColor = brushColor.clone();

        if (paintType === 'metallic') {
          // Sparkle effect via random brightness variations
          const sparkleIntensity = 0.3; // Max intensity for sparkle variation
          const randomBrightness = 1 + (Math.random() - 0.5) * sparkleIntensity; // +/- 15% variation
          
          // Optionally add sparkleColor if needed for tint (e.g., make sparkles more silvery)
          const sparkleColor = new Color(1, 1, 1); // White for sparkle highlights
          if (randomBrightness > 1) {
            // Blend slightly towards sparkleColor on brighter spots
            newColor = newColor.lerp(sparkleColor, (randomBrightness - 1) * 0.5);
          }

          // Apply random brightness multiplier to create sparkle effect
          newColor = newColor.multiplyScalar(randomBrightness);

          // Clamp color values to ensure valid RGB range
          newColor.r = Math.min(1, Math.max(0, newColor.r));
          newColor.g = Math.min(1, Math.max(0, newColor.g));
          newColor.b = Math.min(1, Math.max(0, newColor.b));
        } else {
          // Regular paint blending (no sparkle effect)
          newColor = previousColor.clone().lerp(
            brushColor,
            brushOpacity
          );
        }

        // Set the new color on the vertex
        colorAttribute.setXYZ(i, newColor.r, newColor.g, newColor.b);

        // Record this change in currentAction for undo functionality
        if (currentAction.current && !currentAction.current.vertexSet.has(i)) {
          currentAction.current.vertices.push({
            index: i,
            previousColor: previousColor.clone(),
            newColor: newColor.clone(),
          });
          currentAction.current.vertexSet.add(i); // Track vertices to avoid duplicates
        }
      }
    });

    colorAttribute.needsUpdate = true;
    if (onColorUsed) {
      onColorUsed(brushColor);
    }
    setIsModelSaved(false);
  },
  [brushColor, brushOpacity, brushSize, paintType, geometry]
);




    const throttledPaint = useMemo(() => throttle(paint, 30), [paint]);

    useEffect(() => {
      return () => {
        throttledPaint.cancel();
      };
    }, [throttledPaint]);

    // Event Handlers
    const handlePointerDown = (event) => {
      if (event.button !== 0) return; // Only allow left-click for painting
      setIsPainting(true);
      currentAction.current = { vertices: [], vertexSet: new Set() };
      paint(event); // Initial paint on click
      redoHistory.current = [];
      triggerHistoryChange();
      event.stopPropagation();
    };
    
    const handlePointerMove = (event) => {
      if (!isPainting) return; // Only paint if isPainting is true
      throttledPaint(event); // Continuous painting
      setBrushPosition(event.point);
      event.stopPropagation();
    };
    
    const handlePointerUp = () => {
      if (isPainting && currentAction.current && currentAction.current.vertices.length > 0) {
        history.current.push({
          vertices: currentAction.current.vertices.map((v) => ({
            index: v.index,
            previousColor: v.previousColor.clone(),
            newColor: v.newColor.clone(),
          })),
        });
        currentAction.current = null;
        triggerHistoryChange();
      }
      setIsPainting(false);
    };
    

    // src/components/ModelViewer/ModelViewer.js


    return geometry && geometry.boundingSphere ? (
      <>
        <mesh
          ref={meshRef}
          geometry={geometry}
          castShadow
          receiveShadow
          position={[position.x, position.y, position.z]}
          rotation={[rotation.x, rotation.y, rotation.z]}
          scale={[scale.x, scale.y, scale.z]}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <meshStandardMaterial
            vertexColors={true}
            metalness={metalness}
            roughness={roughness}
            color={new Color(color)}
            side={DoubleSide}
          />

        </mesh>
        <BrushPreview position={brushPosition} brushSize={brushSize} />
      </>
    ) : null;

        }
      );

export default ModelViewer;
