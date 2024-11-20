// src/utils/exportModel.js

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

const exportModel = async (mesh, filePath) => {
  if (!mesh) {
    console.error('No mesh provided for export');
    return;
  }
  
  const exporter = new GLTFExporter();
  exporter.parse(mesh, async (gltf) => {
    const data = JSON.stringify(gltf);
    await window.electron.saveFile(filePath, data);
    console.log("Model exported successfully to", filePath);
  });
};

export default exportModel;
