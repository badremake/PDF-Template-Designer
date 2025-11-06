import React, { useRef } from 'react';
import { PdfElementType } from '../types';
import { ImageIcon, LineIcon, PlaceholderIcon, TextIcon, SaveIcon, UploadIcon } from './icons';

interface ToolbarProps {
  onAddElement: (type: PdfElementType) => void;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddElement, onSave, onLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="bg-slate-800 p-2 flex flex-col items-center gap-4 border-r border-slate-700">
      <h2 className="text-sm font-bold text-slate-400 mt-2">Elements</h2>
      <button
        onClick={() => onAddElement('text')}
        className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full flex justify-center"
        title="Add Text"
        aria-label="Add Text Element"
      >
        <TextIcon />
      </button>
      <button
        onClick={() => onAddElement('image')}
        className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full flex justify-center"
        title="Add Image"
        aria-label="Add Image Element"
      >
        <ImageIcon />
      </button>
       <button
        onClick={() => onAddElement('line')}
        className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full flex justify-center"
        title="Add Line"
        aria-label="Add Line Element"
      >
        <LineIcon />
      </button>
       <button
        onClick={() => onAddElement('placeholder')}
        className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full flex justify-center"
        title="Add Placeholder"
        aria-label="Add Placeholder Element"
      >
        <PlaceholderIcon />
      </button>

      <div className="flex-grow"></div>

      <h2 className="text-sm font-bold text-slate-400 mt-2">File</h2>
       <button
        onClick={onSave}
        className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full flex justify-center"
        title="Save Design"
        aria-label="Save Design"
      >
        <SaveIcon />
      </button>
      <button
        onClick={handleLoadClick}
        className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full flex justify-center"
        title="Load Design"
        aria-label="Load Design"
      >
        <UploadIcon />
      </button>
      <input type="file" ref={fileInputRef} onChange={onLoad} accept=".json" className="hidden" />

    </div>
  );
};
