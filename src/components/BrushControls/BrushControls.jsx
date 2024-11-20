import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SketchPicker } from 'react-color';
import { Color } from 'three';
import { setPaintType } from '../../redux/materialSlice';

function BrushControls({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  brushOpacity,
  setBrushOpacity,
  colorHistory,
  selectColorFromHistory,
}) {
  const dispatch = useDispatch();
  const paintType = useSelector((state) => state.material.paintType); // Access current paint type

  const handleSetPaintType = (type) => {
    dispatch(setPaintType(type));
  };

  return (
    <div className="mt-4">
      {/* Paint Type Selection */}
      <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Paint Type</label>
  <div className="flex justify-between space-x-2">
    {/* Basic */}
    <div className="flex flex-col items-center">
      <button
        onClick={() => handleSetPaintType('basic')}
        className={`w-12 h-12 rounded-full flex justify-center items-center ${
          paintType === 'basic' ? 'bg-blue-500 shadow-lg ring-2 ring-blue-300' : 'bg-black'
        }`}
        title="Basic"
      >
        <span className="text-2xl">🎨</span>
      </button>
      <span className="text-xs text-gray-600 mt-1">Basic</span>
    </div>

    {/* Metallic */}
    <div className="flex flex-col items-center">
      <button
        onClick={() => handleSetPaintType('metallic')}
        className={`w-12 h-12 rounded-full flex justify-center items-center ${
          paintType === 'metallic' ? 'bg-blue-500 shadow-lg ring-2 ring-blue-300' : 'bg-black'
        }`}
        title="Metallic"
      >
        <span className="text-2xl">✨</span>
      </button>
      <span className="text-xs text-gray-600 mt-1">Metallic</span>
    </div>

    {/* Wash */}
    <div className="flex flex-col items-center">
      <button
        onClick={() => handleSetPaintType('wash')}
        className={`w-12 h-12 rounded-full flex justify-center items-center ${
          paintType === 'wash' ? 'bg-blue-500 shadow-lg ring-2 ring-blue-300' : 'bg-black'
        }`}
        title="Wash"
      >
        <span className="text-2xl">💧</span>      
        </button>
      <span className="text-xs text-gray-600 mt-1">Wash</span>
    </div>

    {/* Dry Brush */}
    <div className="flex flex-col items-center">
      <button
        onClick={() => handleSetPaintType('dryBrush')}
        className={`w-12 h-12 rounded-full flex justify-center items-center ${
          paintType === 'dryBrush' ? 'bg-blue-500 shadow-lg ring-2 ring-blue-300' : 'bg-black'
        }`}
        title="Dry Brush"
      >
        <span className="text-2xl">🖌️</span>
      </button>
      <span className="text-xs text-gray-600 mt-1">Dry Brush</span>
    </div>
  </div>
</div>


      {/* Brush Color Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Brush Color</label>
        <SketchPicker
          color={brushColor.getStyle()}
          onChangeComplete={(color) => setBrushColor(new Color(color.hex))}
          presetColors={[]}
        />
      </div>

      {/* Color History Grid */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Color History</label>
        <div className="color-history">
          {colorHistory.map((color, index) => (
            <button
              key={index}
              onClick={() => selectColorFromHistory(color)}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Brush Size Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Brush Size</label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={brushSize}
          onChange={(e) => setBrushSize(parseFloat(e.target.value))}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{brushSize.toFixed(1)}</span>
      </div>

      {/* Brush Opacity Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Brush Opacity</label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1"
          value={brushOpacity}
          onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
        <span className="text-sm text-gray-600">{brushOpacity.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default BrushControls;
