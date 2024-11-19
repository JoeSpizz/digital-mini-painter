// src/components/Toolbar.js

import React from 'react';

function Toolbar({ onFileUpload, onUndo, onRedo, onExport, canUndo, canRedo, onOpenPaletteModal, onOpenMaterialModal, onOpenBackgroundModal }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const fileType = file.name.endsWith('.stl') ? 'stl' : 'gltf';
        const blobUrl = URL.createObjectURL(new Blob([arrayBuffer]));
        onFileUpload(blobUrl, fileType, file.path); // Pass the original file path here
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="toolbar fixed top-0 left-0 right-0 z-20 bg-gray-100 shadow-md p-4 flex justify-center items-center gap-4">
      <button onClick={() => document.getElementById('file-upload').click()} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Choose File</button>
      <input id="file-upload" type="file" accept=".stl,.gltf,.glb" onChange={handleFileChange} className="hidden" />
      
      <button onClick={onUndo} disabled={!canUndo} className={`px-4 py-2 rounded-md border transition-colors ${canUndo ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed'}`}>Undo</button>
      <button onClick={onRedo} disabled={!canRedo} className={`px-4 py-2 rounded-md border transition-colors ${canRedo ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed'}`}>Redo</button>
      <button onClick={onExport} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Export Model</button>

      <button onClick={onOpenMaterialModal} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Model Material</button>
      <button onClick={onOpenBackgroundModal} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Background Settings</button>
      <button onClick={onOpenPaletteModal} className="px-4 py-2 bg-blue-500 text-white rounded-md">Manage Palettes</button>
    </div>
  );
}

export default Toolbar;
