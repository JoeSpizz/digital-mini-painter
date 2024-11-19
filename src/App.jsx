// src/App.js

import React, { useState, useRef, useEffect } from 'react';
import ModelViewer from './components/ModelViewer/ModelViewer';
import Toolbar from './components/Toolbar';
import BrushControls from './components/BrushControls/BrushControls';
import ControlPanel from './components/ControlPanel/ControlPanel';
import ColorPicker from './components/ColorPicker/ColorPicker';
import exportModel from './utils/exportUtils';
import LightingControls from './components/LightingControls/LightingControls';
import PaletteModal from './components/Palette/PaletteManager';
import BackgroundControls from './components/BackgroundControls/BackgroundControls';
import TutorialModal from './components/TutorialModel/TutorialModel';
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
  const [isModelSaved, setIsModelSaved] = useState(true);
  const dispatch = useDispatch();
  const ambientIntensity = useSelector((state) => state.lighting.ambientLight.intensity);
  const directionalLights = useSelector((state) => state.lighting.directionalLights);
  const [brushColor, setBrushColor] = useState(new Color('#FF0000'));
  const [brushSize, setBrushSize] = useState(1.5);
  const [brushOpacity, setBrushOpacity] = useState(0.75);
  const modelViewerRef = useRef();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [colorHistory, setColorHistory] = useState([new Color('#FF0000').getStyle()]);
  const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState([]);
  const [backgroundType, setBackgroundType] = useState('solid');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');
  const [backgroundGradient, setBackgroundGradient] = useState(['#ffffff', '#000000']);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [gradientAngle, setGradientAngle] = useState(90); 

// Update whenever the save state changes
useEffect(() => {
  window.isModelSaved = isModelSaved;
}, [isModelSaved]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isModelSaved) {
        event.preventDefault();
        // Modern browsers require setting returnValue to trigger a confirmation dialog
        event.returnValue = ''; 
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isModelSaved]);

  // Color History Functions
  const addColorToHistory = (newColor) => {
    const colorLower = newColor.toLowerCase();
    setColorHistory((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== colorLower);
      return [colorLower, ...filtered].slice(0, 20);
    });
  };

  const handleSavePalette = async (paletteName) => {
    if (!paletteName) return; // Ensure the palette name is provided

    const palette = {
      name: paletteName,
      colors: colorHistory,
    };

    try {
      await window.electron.savePalette(palette);
      console.log(`Palette saved: ${paletteName}`);
      loadSavedPalettes(); // Refresh the list after saving
    } catch (error) {
      console.error('Failed to save palette:', error);
    }
  };

  const handleLoadPalette = (paletteColors) => {
    setColorHistory((prevHistory) => {
      // Add new colors to the existing history, filtering out duplicates
      const mergedColors = [...new Set([...prevHistory, ...paletteColors])];
      // Limit to the most recent 20 colors
      return mergedColors.slice(-20);
    });
  };
  

  const loadSavedPalettes = async () => {
    const palettes = await window.electron.getPalettes();
    setSavedPalettes(palettes);
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
      setColorHistory([]);
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
      setIsModelSaved(true);
    } catch (error) {
      console.error("Error saving color history:", error);
    }
  };

  const handleHistoryChange = (undoAvailable, redoAvailable) => {
    setCanUndo(undoAvailable);
    setCanRedo(redoAvailable);
  };

  const openPaletteModal = () => setIsPaletteModalOpen(true);
  const closePaletteModal = () => setIsPaletteModalOpen(false);

  const openMaterialModal = () => setIsMaterialModalOpen(true);
  const closeMaterialModal = () => setIsMaterialModalOpen(false);

  const openBackgroundModal = () => setIsBackgroundModalOpen(true);
  const closeBackgroundModal = () => setIsBackgroundModalOpen(false);

  const getBackgroundStyle = () => {
    if (backgroundType === 'solid') {
      return { backgroundColor };
    } else if (backgroundType === 'gradient') {
      return {
        backgroundImage: `linear-gradient(${gradientAngle}deg, ${backgroundGradient[0]}, ${backgroundGradient[1]})`,
      };
    } else if (backgroundType === 'image' && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {};
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
        onOpenPaletteModal={() => {
          loadSavedPalettes();
          setIsPaletteModalOpen(true);
        }}
        onOpenMaterialModal={openMaterialModal}
        onOpenBackgroundModal={openBackgroundModal}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />
      <PaletteModal
        isOpen={isPaletteModalOpen}
        onClose={() => setIsPaletteModalOpen(false)}
        onSavePalette={handleSavePalette} // Passing handleSavePalette
        onLoadPalette={handleLoadPalette} // Passing handleLoadPalette
        savedPalettes={savedPalettes}
      />

<TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {isMaterialModalOpen && (
        <Draggable handle=".drag-handle">
          <div className="modal">
            <button onClick={closeMaterialModal} className="absolute top-1 right-2 p-2">✕</button>
            <div>
            <ColorPicker />
            </div>
          </div>
        </Draggable>
      )}

      {isBackgroundModalOpen && (
        <Draggable handle=".drag-handle">
          <div className="modal">
            <button onClick={closeBackgroundModal} className="absolute top-1 right-2">✕</button>
            <BackgroundControls 
              backgroundType={backgroundType}
              setBackgroundType={setBackgroundType}
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
              backgroundGradient={backgroundGradient}
              setBackgroundGradient={setBackgroundGradient}
              backgroundImage={backgroundImage}
              setBackgroundImage={setBackgroundImage}
              gradientAngle={gradientAngle}
              setGradientAngle={setGradientAngle}
            />
          </div>
        </Draggable>
      )}

      {/* Canvas */}
      <div
      className="absolute inset-0"
      style={getBackgroundStyle()} // Applying background style to the container
    >
      <Canvas className="h-full">
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
          setIsModelSaved={setIsModelSaved}
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
</div>
      {/* Panels */}

      <Draggable handle=".drag-handle">
        <div className="absolute top-64 right-80 z-10 bg-white p-4 shadow-lg rounded-lg">
        <div className="drag-handle cursor-move bg-gray-300 p-2 rounded-t text-center font-semibold">
           Lighting Controls
          </div>
          <LightingControls />
        </div>
      </Draggable>
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
    </div>
  );
}

export default App;
