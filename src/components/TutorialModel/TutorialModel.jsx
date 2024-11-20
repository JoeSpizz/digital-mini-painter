// src/components/TutorialModal/TutorialModal.jsx

import React from 'react';
import CollapsiblePanel from '../CollapsiblePanel'; // Reuse the collapsible component

function TutorialModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="tutorial-modal fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">App Tutorial</h2>

        <CollapsiblePanel title="1. Loading Models" defaultOpen>
          <p>Click 'Choose File' to load an STL or GLTF model. If the model has a saved color palette, it will load automatically.</p>
        </CollapsiblePanel>

        <CollapsiblePanel title="2. Exporting Models">
          <p>Use 'Export Model' to save your work, including the color palette. The export saves both the model and any colors you've applied.</p>
        </CollapsiblePanel>

        <CollapsiblePanel title="3. Model Material and Background Settings">
          <p>Open the 'Model Material' or 'Background Settings' for pre-paint adjustments to your model and its environment.</p>
        </CollapsiblePanel>

        <CollapsiblePanel title="4. Managing Palettes">
          <p>Use 'Manage Palettes' to save or load custom color palettes, which you can apply to any model you’re working on.</p>
        </CollapsiblePanel>

        <CollapsiblePanel title="5. Brush Controls">
          <ul className="list-disc list-inside">
            <li>Select colors and adjust brush size and opacity.</li>
            <li>Choose between Basic, Metallic, or Wash paint types.</li>
            <li>Brush size affects all paint types, while opacity primarily affects Basic paint.</li>
          </ul>
        </CollapsiblePanel>

        <CollapsiblePanel title="6. Model Controls">
          <ul className="list-disc list-inside">
            <li>Left-click to paint.</li>
            <li>Use sliders to rotate, scale, or position the model.</li>
            <li>If you get stuck inside the model, zoom out with the scroll wheel.</li>
            <li>Right-click to move the model in the canvas.</li>
          </ul>
        </CollapsiblePanel>

        <CollapsiblePanel title="7. Lighting Controls">
          <ul className="list-disc list-inside">
            <li>Adjust ambient light intensity and add multiple directional lights.</li>
            <li>Customize each light’s position and intensity for tailored lighting effects.</li>
          </ul>
        </CollapsiblePanel>
      </div>
    </div>
  );
}

export default TutorialModal;
