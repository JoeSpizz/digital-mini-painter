// src/redux/store.js

import { configureStore } from '@reduxjs/toolkit';
import materialReducer from './materialSlice';
import transformReducer from './transformSlice';
import lightingReducer from './lightingSlice';

const store = configureStore({
  reducer: {
    material: materialReducer,
    transform: transformReducer,
    lighting: lightingReducer,
  },
});

export default store;
