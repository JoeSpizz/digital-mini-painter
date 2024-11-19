// src/components/PaletteModal/PaletteModal.js

import React, { useState, useEffect } from 'react';

function PaletteModal({ isOpen, onClose, onSavePalette, onLoadPalette, savedPalettes }) {
  const [paletteName, setPaletteName] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPaletteName('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (paletteName.trim()) {
      onSavePalette(paletteName);
      onClose();
    }
  };

  return isOpen ? (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Palette Management</h2>

        {/* Save Palette Section */}
        <div className="modal-section">
          <h3>Save Palette</h3>
          <input
            type="text"
            value={paletteName}
            onChange={(e) => setPaletteName(e.target.value)}
            placeholder="Enter palette name"
          />
          <button onClick={handleSave}>Save Palette</button>
        </div>

        {/* Load Palette Section */}
        <div className="modal-section">
          <h3>Load Palette</h3>
          <ul>
            {savedPalettes.map((palette, index) => (
              <li key={index}>
                <button onClick={() => { onLoadPalette(palette.colors); onClose(); }}>
                  {palette.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  ) : null;
}

export default PaletteModal;
