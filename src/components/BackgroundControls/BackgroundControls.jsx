// src/components/BackgroundControls/BackgroundControls.jsx

import React from 'react';

function BackgroundControls({
  backgroundType,
  setBackgroundType,
  backgroundColor,
  setBackgroundColor,
  backgroundGradient,
  setBackgroundGradient,
  backgroundImage,
  setBackgroundImage,
  gradientAngle,
  setGradientAngle, // Add this as a new prop
}) {
  const handleBackgroundTypeChange = (type) => setBackgroundType(type);

  const handleColorChange = (e) => setBackgroundColor(e.target.value);
  
  const handleGradientChange = (index, color) => {
    const updatedGradient = [...backgroundGradient];
    updatedGradient[index] = color;
    setBackgroundGradient(updatedGradient);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setBackgroundImage(imageUrl);
    }
  };

  return (
    <div className="p-4">
      <h3 className="drag-handle cursor-move bg-gray-300 p-2 rounded-t text-center font-semibold w-[75%] mb-1 mx-auto">Background Controls</h3>

      <div className="mb-4">
        <label>
          <input type="radio" checked={backgroundType === 'solid'} onChange={() => handleBackgroundTypeChange('solid')} />
          Solid Color
        </label>
        <input type="color" value={backgroundColor} onChange={handleColorChange} disabled={backgroundType !== 'solid'} />
      </div>

      <div className="mb-4">
        <label>
          <input type="radio" checked={backgroundType === 'gradient'} onChange={() => handleBackgroundTypeChange('gradient')} />
          Gradient
        </label>
        <input type="color" value={backgroundGradient[0]} onChange={(e) => handleGradientChange(0, e.target.value)} disabled={backgroundType !== 'gradient'} />
        <input type="color" value={backgroundGradient[1]} onChange={(e) => handleGradientChange(1, e.target.value)} disabled={backgroundType !== 'gradient'} />
      </div>

      {/* Gradient Angle Slider */}
      <div className="mb-4">
        <label className="block mb-1">Gradient Angle: {gradientAngle}°</label>
        <input
          type="range"
          min="0"
          max="360"
          value={gradientAngle}
          onChange={(e) => setGradientAngle(parseInt(e.target.value))}
          disabled={backgroundType !== 'gradient'}
          className="w-full"
        />
      </div>

      <div>
        <label>
          <input type="radio" checked={backgroundType === 'image'} onChange={() => handleBackgroundTypeChange('image')} />
          Background Image
        </label>
        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={backgroundType !== 'image'} />
      </div>
    </div>
  );
}

export default BackgroundControls;
