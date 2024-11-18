// src/App.js

import React, { useState, useRef } from 'react';
import ModelViewer from './components/ModelViewer/ModelViewer';
import Toolbar from './components/Toolbar';
import BrushControls from './components/BrushControls/BrushControls';
import ControlPanel from './components/ControlPanel/ControlPanel';
import ColorPicker from './components/ColorPicker/ColorPicker';
import exportModel from './utils/exportUtils';
import { setAmbientIntensity, addDirectionalLight, removeDirectionalLight, setDirectionalIntensity, setDirectionalPosition } from './redux/lightingSlice';
import { useDispatch, useSelector } from 'react-redux';
import { resetMaterial } from './redux/materialSlice';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Color } from 'three';
import Draggable from 'react-draggable';
import * as THREE from 'three';
import './App.css';

function App() {
  const [modelPath, setModelPath] = useState(null);
  const [modelType, setModelType] = useState(null);
  const dispatch = useDispatch();
  const ambientIntensity = useSelector((state) => state.lighting.ambientLight.intensity);
  const directionalLights = useSelector((state) => state.lighting.directionalLights);


  // Brush States
  const [brushColor, setBrushColor] = useState(new Color('#FF0000'));
  const [brushSize, setBrushSize] = useState(1.5);
  const [brushOpacity, setBrushOpacity] = useState(0.75);
  
  const modelViewerRef = useRef();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Color History State
  const [colorHistory, setColorHistory] = useState([new Color('#FF0000').getStyle()]);

  // Color History Functions
  const addColorToHistory = (newColor) => {
    const colorLower = newColor.toLowerCase();
    setColorHistory((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== colorLower);
      return [colorLower, ...filtered].slice(0, 20);
    });
  };

  const handleColorUsed = (color) => addColorToHistory(color.getStyle());

  const handleSetBrushColor = (color) => setBrushColor(color);

  const selectColorFromHistory = (color) => setBrushColor(new Color(color));

// src/App.js

const handleFileUpload = async (url, type, originalFilePath) => {
  setModelPath(url); // Set the Blob URL for rendering
  setModelType(type);

  // Attempt to load associated color history file using the original file path
  const jsonFilePath = originalFilePath.replace(/\.(stl|gltf|glb)$/, '.json');
  try {
    const colorHistoryData = await window.electron.loadFile(jsonFilePath); // Load JSON from actual file path
    const parsedData = JSON.parse(colorHistoryData);
    
    if (parsedData?.colorHistory) {
      setColorHistory(parsedData.colorHistory.map(({ r, g, b }) => `rgb(${r},${g},${b})`));
      console.log("Color history loaded:", parsedData.colorHistory);
    } else {
      console.warn("No color history found in JSON file or file format incorrect");
    }
  } catch (error) {
    console.warn("No color history JSON file found or failed to load:", error);
  }

  // Reset history and redo stacks for new model load
  if (modelViewerRef.current) {
    modelViewerRef.current.history.current = [];
    modelViewerRef.current.redoHistory.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }

  console.log('New model loaded:', url);
};


  const handleResetMaterial = () => {
    dispatch(resetMaterial());
    if (modelViewerRef.current) {
      modelViewerRef.current.history.current = [];
      modelViewerRef.current.redoHistory.current = [];
      setCanUndo(false);
      setCanRedo(false);
    }
    console.log('Material reset and history cleared');
  };

  const handleUndo = () => modelViewerRef.current?.undo();
  const handleRedo = () => modelViewerRef.current?.redo();
  const handleExport = async () => {
    const filePath = await window.electron.getSaveFilename(); // Prompt to get file path
    
    const mesh = modelViewerRef.current?.mesh; // Retrieve the mesh reference
    if (!filePath || !mesh) {
      console.warn("No model loaded to export or file path not provided.");
      return;
    }
  
    // Step 1: Export the model as .gltf
    exportModel(mesh, filePath);
  
    // Step 2: Save color history as a JSON object
    const colorHistoryFilePath = filePath.replace(/\.gltf$/, '.json');
    const colorHistoryData = {
      colorHistory: colorHistory.map((colorString) => {
        const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [_, r, g, b] = match;
          return {
            r: parseInt(r, 10),
            g: parseInt(g, 10),
            b: parseInt(b, 10),
          };
        }
        return null; // In case the color format is unexpected
      }).filter(Boolean) // Filter out any null results
    };
  
    try {
      await window.electron.saveFile(colorHistoryFilePath, JSON.stringify(colorHistoryData, null, 2));
      console.log("Color history saved successfully to", colorHistoryFilePath);
    } catch (error) {
      console.error("Error saving color history:", error);
    }
  };

  const handleHistoryChange = (undoAvailable, redoAvailable) => {
    setCanUndo(undoAvailable);
    setCanRedo(redoAvailable);
  };

  return (
    <div className="App relative w-screen h-screen bg-gray-100">
      {/* Toolbar */}
      <Toolbar
        onFileUpload={handleFileUpload}
        onReset={handleResetMaterial}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Canvas */}
      <Canvas className="absolute bg-slate-900 inset-0 h-[100vh]">
        <PerspectiveCamera makeDefault position={[0, 0, 100]} fov={75} />
        <ambientLight intensity={ambientIntensity} />
        {directionalLights.map((light) => (
          <directionalLight
            key={light.id}
            position={light.position}
            intensity={light.intensity}
          />))}

        <ModelViewer
          ref={modelViewerRef}
          modelPath={modelPath}
          modelType={modelType}
          brushColor={brushColor}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          onHistoryChange={handleHistoryChange}
          onColorUsed={handleColorUsed}
        />

<OrbitControls
  enablePan={true}
  enableRotate={true}
  enableZoom={true}
  mouseButtons={{
    MIDDLE: THREE.MOUSE.MIDDLE, // Zoom with middle click (wheel)
    RIGHT: THREE.MOUSE.RIGHT, // Rotate with right-click
  }}
/>

      </Canvas>

      {/* Draggable Lighting Control Panel */}
      <Draggable handle=".drag-handle">
        <div className="absolute bottom-20 left-5 z-10 bg-white p-4 shadow-lg rounded-lg">
          <div className="drag-handle cursor-move bg-gray-300 p-2 rounded-t text-center font-semibold">
            Lighting Controls
          </div>

          {/* Ambient Light Intensity */}
          <div className="mb-4">
            <label>Ambient Intensity</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={ambientIntensity}
              onChange={(e) => dispatch(setAmbientIntensity(parseFloat(e.target.value)))}
              className="w-full"
            />
          </div>

          {/* Directional Lights Controls */}
          {directionalLights.map((light) => (
            <div key={light.id} className="mb-4">
              <label>Directional Light {light.id} Intensity</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={light.intensity}
                onChange={(e) => dispatch(setDirectionalIntensity({ id: light.id, intensity: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <label>Position X</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={light.position[0]}
                onChange={(e) => {
                  const newPos = [...light.position];
                  newPos[0] = parseFloat(e.target.value);
                  dispatch(setDirectionalPosition({ id: light.id, position: newPos }));
                }}
                className="w-full"
              />
               {/* Position Y */}
               <label>Position Y</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={light.position[1]}
                onChange={(e) => {
                  const newPos = [...light.position];
                  newPos[1] = parseFloat(e.target.value);
                  dispatch(setDirectionalPosition({ id: light.id, position: newPos }));
                }}
                className="w-full"
              />

              {/* Optional: Position Z */}
              <label>Position Z</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={light.position[2]}
                onChange={(e) => {
                  const newPos = [...light.position];
                  newPos[2] = parseFloat(e.target.value);
                  dispatch(setDirectionalPosition({ id: light.id, position: newPos }));
                }}
                className="w-full"
              />
              {/* Add similar sliders for Y and Z position here */}
              <button onClick={() => dispatch(removeDirectionalLight(light.id))} className="mt-2 text-red-500">
                Remove Light
              </button>
            </div>
          ))}

          {/* Button to add a new directional light */}
          <button onClick={() => dispatch(addDirectionalLight())} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded shadow">
            Add Directional Light
          </button>
        </div>
      </Draggable>

      {/* Panels */}
      <Draggable handle=".drag-handle">
        <div className="absolute top-20 left-5 z-10 bg-white p-4 shadow-lg rounded-lg">
          <div className="drag-handle cursor-move bg-gray-300 p-2 rounded-t text-center font-semibold">
            Brush Controls
          </div>
          <BrushControls
            brushColor={brushColor}
            setBrushColor={handleSetBrushColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            brushOpacity={brushOpacity}
            setBrushOpacity={setBrushOpacity}
            colorHistory={colorHistory}
            selectColorFromHistory={selectColorFromHistory}
          />
        </div>
      </Draggable>

      <Draggable handle=".drag-handle">
        <div className="absolute top-20 right-5 z-10 bg-white p-4 shadow-lg rounded-lg">
          <div className="drag-handle cursor-move bg-gray-300 p-2 rounded-t text-center font-semibold">
            Model Controls
          </div>
          <ControlPanel />
        </div>
      </Draggable>

      <Draggable handle=".drag-handle">
        <div className="absolute top-20 right-72 z-10 bg-white p-4 shadow-lg rounded-lg">
          <div className="drag-handle cursor-move bg-gray-300 p-2 rounded-t text-center font-semibold">
            Model Material
          </div>
          <ColorPicker />
        </div>
      </Draggable>
    </div>
  );
}

export default App;
