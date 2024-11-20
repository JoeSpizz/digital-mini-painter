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
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    if (!geometry.hasAttribute('normal')) geometry.computeVertexNormals();

    // Only initialize colors once
    if (!geometry.hasAttribute('color')) {
      const colorArray = new Float32Array(geometry.attributes.position.count * 3).fill(1); // Default white
      geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
      geometry.attributes.color.needsUpdate = true;
    }
  }
}, [geometry]);


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
    const normalAttribute = geometry.attributes.normal; // Access normal data
    const intersectPoint = event.point.clone().applyMatrix4(inverseMatrix);

    const queryBox = {
      minX: intersectPoint.x - brushSize,
      minY: intersectPoint.y - brushSize,
      minZ: intersectPoint.z - brushSize,
      maxX: intersectPoint.x + brushSize,
      maxY: intersectPoint.y + brushSize,
      maxZ: intersectPoint.z + brushSize,
    };

  const nearestPoints = rbushTree.search(queryBox).filter((point) => {
  tmpVertex.fromBufferAttribute(geometry.attributes.position, point.index);
  return tmpVertex.distanceTo(intersectPoint) <= brushSize; // Only include points within the brush radius
});
    nearestPoints.forEach((point) => {
      const i = point.index;
      tmpVertex.fromBufferAttribute(geometry.attributes.position, i);
      const distance = tmpVertex.distanceTo(intersectPoint);

      if (distance <= brushSize) {
        const previousColor = new Color(
          colorAttribute.getX(i),
          colorAttribute.getY(i),
          colorAttribute.getZ(i)
        );

        let newColor = brushColor.clone();

        if (paintType === 'dryBrush') {
          const DRY_BRUSH_CONFIG = {
            maxNeighbors: 8,         // Neighbor sampling
            angleThreshold: 70,      // Edge detection sensitivity
            opacityMultiplier: 0.35,  // Dry brush intensity
            minEdgeIntensity: 0.2,   // Minimum edge highlight
          };
        
          tmpVertex.fromBufferAttribute(geometry.attributes.position, i);
          const normal = new THREE.Vector3().fromBufferAttribute(normalAttribute, i);
          
          let edgeIntensity = 0;
          const maxNeighbors = Math.min(nearestPoints.length, DRY_BRUSH_CONFIG.maxNeighbors);
          const neighborStep = Math.max(1, Math.floor(nearestPoints.length / maxNeighbors));
        
          for (let j = 0; j < nearestPoints.length; j += neighborStep) {
            const neighbor = nearestPoints[j];
            if (neighbor.index !== i) {
              const neighborNormal = new THREE.Vector3().fromBufferAttribute(normalAttribute, neighbor.index);
              
              const angleDifference = Math.acos(
                Math.min(Math.max(normal.dot(neighborNormal), -1), 1)
              ) * (180 / Math.PI);
              
              // Detect raised edges by looking for SMALLER angle differences
              if (angleDifference < DRY_BRUSH_CONFIG.angleThreshold) {
                // Closer to parallel normals indicate raised surfaces
                edgeIntensity += 1 - (angleDifference / DRY_BRUSH_CONFIG.angleThreshold);
              }
            }
          }
        
          edgeIntensity = Math.min(edgeIntensity / maxNeighbors, 1);
          
          // Invert the intensity calculation compared to wash
          const dryBrushOpacity = Math.max(
            edgeIntensity * DRY_BRUSH_CONFIG.opacityMultiplier, 
            DRY_BRUSH_CONFIG.minEdgeIntensity
          );
        
          // Only apply if edge intensity is significant
          if (dryBrushOpacity > DRY_BRUSH_CONFIG.minEdgeIntensity) {
            newColor = previousColor.clone().lerp(brushColor, dryBrushOpacity);
          } else {
            // Minimal to no change on non-edges
            newColor = previousColor.clone();
          }
        }
        
        else if (paintType === 'wash') {
          const WASH_CONFIG = {
            maxNeighbors: 8,         // Neighbor sampling
            angleThreshold: 45,      // Crease sensitivity
            opacityMultiplier: 0.5,  // Wash intensity
            minOpacity: 0.005,        // Minimum paint threshold
          };
        
          tmpVertex.fromBufferAttribute(geometry.attributes.position, i);
          const normal = new THREE.Vector3().fromBufferAttribute(normalAttribute, i);
          
          let creaseIntensity = 0;
          const maxNeighbors = Math.min(nearestPoints.length, WASH_CONFIG.maxNeighbors);
          const neighborStep = Math.max(1, Math.floor(nearestPoints.length / maxNeighbors));
        
          for (let j = 0; j < nearestPoints.length; j += neighborStep) {
            const neighbor = nearestPoints[j];
            if (neighbor.index !== i) {
              const neighborNormal = new THREE.Vector3().fromBufferAttribute(normalAttribute, neighbor.index);
              
              const angleDifference = Math.acos(
                Math.min(Math.max(normal.dot(neighborNormal), -1), 1)
              ) * (180 / Math.PI);
              
              if (angleDifference > WASH_CONFIG.angleThreshold) {
                creaseIntensity += 1 / (1 + Math.abs(angleDifference - 90) / 45);
              }
            }
          }
        
          creaseIntensity = Math.min(creaseIntensity / maxNeighbors, 1);
          const washOpacity = Math.pow(creaseIntensity, 2) * WASH_CONFIG.opacityMultiplier;
          
          if (washOpacity > WASH_CONFIG.minOpacity) {
            newColor = previousColor.clone().lerp(brushColor, washOpacity);
          } else {
            newColor = previousColor.clone();
          }
        } else if (paintType === 'metallic') {
          // Metallic sparkle logic here
          const sparkleIntensity = 0.3;
          const randomBrightness = 1 + (Math.random() - 0.5) * sparkleIntensity;
          newColor = newColor.multiplyScalar(randomBrightness).lerp(new Color(1, 1, 1), (randomBrightness - 1) * 0.5);
          newColor.r = Math.min(1, Math.max(0, newColor.r));
          newColor.g = Math.min(1, Math.max(0, newColor.g));
          newColor.b = Math.min(1, Math.max(0, newColor.b));
        } else {
          // Regular paint blending
          newColor = previousColor.clone().lerp(brushColor, brushOpacity);
        }

        colorAttribute.setXYZ(i, newColor.r, newColor.g, newColor.b);

        if (currentAction.current && !currentAction.current.vertexSet.has(i)) {
          currentAction.current.vertices.push({
            index: i,
            previousColor: previousColor.clone(),
            newColor: newColor.clone(),
          });
          currentAction.current.vertexSet.add(i);
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





    const throttledPaint = useMemo(() => throttle(paint, 50), [paint]);

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
