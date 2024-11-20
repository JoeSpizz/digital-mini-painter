// src/components/LightingControls.js

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setAmbientIntensity,
  addDirectionalLight,
  removeDirectionalLight,
  setDirectionalIntensity,
  setDirectionalPosition,
} from '../../redux/lightingSlice';
import CollapsiblePanel from '../CollapsiblePanel';

function LightingControls() {
  const dispatch = useDispatch();
  const ambientIntensity = useSelector((state) => state.lighting.ambientLight.intensity);
  const directionalLights = useSelector((state) => state.lighting.directionalLights);
  const [expandedLight, setExpandedLight] = useState(null); // Track expanded light for position controls

  return (
    <div title="Lighting Controls">
      <CollapsiblePanel>
      {/* Ambient Light Intensity */}
      <div className="mb-2">
        <label className="text-sm font-medium">Ambient Intensity</label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={ambientIntensity}
          onChange={(e) => dispatch(setAmbientIntensity(parseFloat(e.target.value)))}
          className="w-full mt-1"
        />
      </div>

      {/* Directional Lights Controls */}
      {directionalLights.map((light) => (
        <div key={light.id} className="mb-2 border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Light {light.id} Intensity</span>
            <button
              className="text-xs text-blue-500"
              onClick={() => setExpandedLight(expandedLight === light.id ? null : light.id)}
            >
              {expandedLight === light.id ? 'Hide Position' : 'Adjust Position'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={light.intensity}
            onChange={(e) => dispatch(setDirectionalIntensity({ id: light.id, intensity: parseFloat(e.target.value) }))}
            className="w-full mt-1"
          />

          {/* Position Sliders (Collapsible) */}
          {expandedLight === light.id && (
            <div className="mt-2 space-y-1">
              <label className="text-xs">Position X</label>
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
              <label className="text-xs">Position Y</label>
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
              <label className="text-xs">Position Z</label>
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
            </div>
          )}
          <button
            onClick={() => dispatch(removeDirectionalLight(light.id))}
            className="mt-2 text-xs text-red-500"
          >
            Remove Light
          </button>
        </div>
      ))}

      {/* Button to add a new directional light */}
      <button
        onClick={() => dispatch(addDirectionalLight())}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 mt-2 rounded shadow"
      >
        Add Directional Light
      </button>
      </CollapsiblePanel>
    </div>
  );
}

export default LightingControls;
