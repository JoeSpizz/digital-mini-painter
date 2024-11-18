// src/redux/lightingSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ambientLight: { intensity: 0.5 },
  directionalLights: [
    { id: 1, intensity: 1, position: [10, 10, 10] },
    { id: 2, intensity: 1, position: [-10, -10, -10] },
  ],
};

const lightingSlice = createSlice({
  name: 'lighting',
  initialState,
  reducers: {
    setAmbientIntensity(state, action) {
      state.ambientLight.intensity = action.payload;
    },
    addDirectionalLight(state) {
      const newId = state.directionalLights.length + 1;
      state.directionalLights.push({ id: newId, intensity: 1, position: [0, 10, 10] });
    },
    removeDirectionalLight(state, action) {
      state.directionalLights = state.directionalLights.filter(light => light.id !== action.payload);
    },
    setDirectionalIntensity(state, action) {
      const { id, intensity } = action.payload;
      const light = state.directionalLights.find(light => light.id === id);
      if (light) light.intensity = intensity;
    },
    setDirectionalPosition(state, action) {
      const { id, position } = action.payload;
      const light = state.directionalLights.find(light => light.id === id);
      if (light) light.position = position;
    },
  },
});

export const {
  setAmbientIntensity,
  addDirectionalLight,
  removeDirectionalLight,
  setDirectionalIntensity,
  setDirectionalPosition,
} = lightingSlice.actions;

export default lightingSlice.reducer;
