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
        <label className="block text-sm font-medium text-gray-700 mb-1">Paint Type</label>
        <div className="flex space-x-2">
          <button
            onClick={() => handleSetPaintType('basic')}
            className={`px-4 py-2 rounded ${
              paintType === 'basic' ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300' : 'bg-gray-300 text-gray-700'
            }`}
          >
            Basic
          </button>
          <button
            onClick={() => handleSetPaintType('metallic')}
            className={`px-4 py-2 rounded ${
              paintType === 'metallic' ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300' : 'bg-gray-300 text-gray-700'
            }`}
          >
            Metallic
          </button>
          <button
            onClick={() => handleSetPaintType('wash')}
            className={`px-4 py-2 rounded ${
              paintType === 'wash' ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300' : 'bg-gray-300 text-gray-700'
            }`}
          >
            Wash
          </button>
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
