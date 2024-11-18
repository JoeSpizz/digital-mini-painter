// src/components/BrushControls/BrushControls.js

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

  return (
    <div className="mt-4">
      {/* Brush Color Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Brush Color</label>
        <SketchPicker
          color={brushColor.getStyle()}
          onChangeComplete={(color) => setBrushColor(new Color(color.hex))}
        />
      </div>

      {/* Metallic Paint Toggle Button */}
      <div className="mb-4">
        <button
          onClick={() => dispatch(setPaintType(paintType === 'basic' ? 'metallic' : 'basic'))}
          className={`w-full py-2 font-medium rounded ${
            paintType === 'metallic' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
          }`}
        >
          {paintType === 'metallic' ? 'Metallic Paint' : 'Basic Paint'}
        </button>
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
