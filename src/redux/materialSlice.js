// src/redux/materialSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  color: '#FFFFFF',   // Default color
  metalness: 0.5,     // Default metalness
  roughness: 0.5,     // Default roughness
  paintType: 'basic',
};

const materialSlice = createSlice({
  name: 'material',
  initialState,
  reducers: {
    setColor(state, action) {
      state.color = action.payload;
    },
    setMetalness(state, action) {
      state.metalness = action.payload;
    },
    setRoughness(state, action) {
      state.roughness = action.payload;
    },
    setPaintType(state, action) { // Action to toggle paint type
      state.paintType = action.payload;
    },
    resetMaterial(state) {
      state.color = initialState.color;
      state.metalness = initialState.metalness;
      state.roughness = initialState.roughness;
    },
  },
});

export const { setColor, setMetalness, setRoughness, resetMaterial, setPaintType } = materialSlice.actions;
export default materialSlice.reducer;
