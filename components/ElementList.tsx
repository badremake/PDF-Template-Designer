import React from 'react';
import { PdfElement, PdfElementType } from '../types';
import { ImageIcon, LineIcon, PlaceholderIcon, TextIcon } from './icons';

interface ElementListProps {
  elements: PdfElement[];
  selectedElementIds: string[];
  onSelectElements: (ids: string[], append: boolean) => void;
}

const getElementIcon = (type: PdfElementType) => {
  switch (type) {
    case 'text': return <TextIcon />;
    case 'image': return <ImageIcon />;
    case 'line': return <LineIcon />;
    case 'placeholder': return <PlaceholderIcon />;
    default: return null;
  }
};

const getElementName = (element: PdfElement) => {
  switch (element.type) {
    case 'text':
      const text = element.text;
      return `Text: "${text.length > 15 ? text.substring(0, 15) + '...' : text}"`;
    case 'image': return `Image`;
    case 'line': return `Line`;
    case 'placeholder': return `Placeholder: ${element.label}`;
    default: return 'Unknown Element';
  }
};

export const ElementList: React.FC<ElementListProps> = ({ elements, selectedElementIds, onSelectElements }) => {
  
  const handleElementClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSelectElements([id], e.shiftKey);
  };
  
  return (
    <div className="bg-slate-800 p-2 text-white w-64 h-full overflow-y-auto border-r border-slate-700">
      <h3 className="text-lg font-bold mb-4 text-slate-300 border-b border-slate-700 pb-2">Elements</h3>
      <ul>
        {elements.slice().reverse().map((element) => {
            const isSelected = selectedElementIds.includes(element.id);
            return (
              <li
                key={element.id}
                onClick={(e) => handleElementClick(e, element.id)}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer mb-1 transition-colors ${
                  isSelected ? 'bg-cyan-800' : 'hover:bg-slate-700'
                }`}
              >
                <span className={isSelected ? 'text-white' : 'text-slate-400'}>
                    {getElementIcon(element.type)}
                </span>
                <span className="truncate text-sm">{getElementName(element)}</span>
              </li>
            )
        })}
      </ul>
    </div>
  );
};
