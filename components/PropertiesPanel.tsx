import React from 'react';
import { PdfElement, PdfText, PdfImage, PdfLine, PdfPlaceholder, PageSettings } from '../types';
import { CopyIcon, TrashIcon } from './icons';
import { convertToPt, convertFromPt } from '../utils/conversions';

interface PropertiesPanelProps {
  selectedElements: PdfElement[];
  onUpdateElement: (element: PdfElement) => void;
  onDuplicateElements: () => void;
  onDeleteElements: () => void;
  pageSettings: PageSettings;
  onUpdatePageSettings: (settings: PageSettings) => void;
}

const fontFamilies = [
  'Helvetica', 'Arial', 'Times New Roman', 'Courier', 'Verdana', 'Georgia', 'Garamond', 'Comic Sans MS'
];

const PRESETS: Record<string, { name: string, width?: number, height?: number }> = {
  'custom': { name: 'Personalizado' },
  'letter': { name: 'Carta (Letter)', width: 612, height: 792 },
  'half-letter': { name: 'Media Carta (Half Letter)', width: 396, height: 612 },
  'a4': { name: 'A4', width: 595, height: 842 },
};


export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedElements, onUpdateElement, onDuplicateElements, onDeleteElements, pageSettings, onUpdatePageSettings
}) => {
  const element = selectedElements.length === 1 ? selectedElements[0] : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!element) return;
    const { name, value, type } = e.target;
    let numericValue = type === 'number' ? parseFloat(value) : value;
    if (name === 'opacity' || name === 'strokeWidth') {
      numericValue = Math.max(0, parseFloat(value));
    }

    const updatedElement = { ...element, [name]: numericValue };
    onUpdateElement(updatedElement);
  };
  
  const handlePageDimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const valueInUnit = parseFloat(value) || 0;
    const valueInPt = convertToPt(valueInUnit, pageSettings.unit);
    onUpdatePageSettings({ ...pageSettings, [name]: valueInPt });
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as PageSettings['unit'];
    onUpdatePageSettings({ ...pageSettings, unit: newUnit });
  };
  
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetKey = e.target.value;
    if (presetKey !== 'custom') {
      const preset = PRESETS[presetKey];
      onUpdatePageSettings({ ...pageSettings, width: preset.width!, height: preset.height! });
    }
  };

  const getCurrentPreset = () => {
    for (const [key, value] of Object.entries(PRESETS)) {
      if (key !== 'custom' && value.width === pageSettings.width && value.height === pageSettings.height) {
        return key;
      }
    }
    return 'custom';
  };


  const renderPageSettings = () => (
     <>
      <h3 className="text-lg font-bold mb-4 text-slate-300 border-b border-slate-700 pb-2">Ajustes de Página</h3>
        <div className="mb-2">
            <label className="block text-sm font-medium">Tamaño Predeterminado</label>
            <select value={getCurrentPreset()} onChange={handlePresetChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1">
                {Object.entries(PRESETS).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
            </select>
        </div>
        <div className="mb-2">
            <label className="block text-sm font-medium">Unidad</label>
            <select name="unit" value={pageSettings.unit} onChange={handleUnitChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1">
                <option value="pt">Puntos (pt)</option>
                <option value="mm">Milímetros (mm)</option>
                <option value="cm">Centímetros (cm)</option>
                <option value="in">Pulgadas (in)</option>
            </select>
        </div>
        <div className="mb-2">
            <label className="block text-sm font-medium">Ancho</label>
            <div className="flex items-center gap-2">
              <input type="number" name="width" value={convertFromPt(pageSettings.width, pageSettings.unit).toFixed(2)} onChange={handlePageDimChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
              {pageSettings.unit !== 'pt' && <span className="text-xs text-slate-400">({Math.round(pageSettings.width)} pt)</span>}
            </div>
        </div>
        <div className="mb-2">
            <label className="block text-sm font-medium">Alto</label>
             <div className="flex items-center gap-2">
                <input type="number" name="height" value={convertFromPt(pageSettings.height, pageSettings.unit).toFixed(2)} onChange={handlePageDimChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
                {pageSettings.unit !== 'pt' && <span className="text-xs text-slate-400">({Math.round(pageSettings.height)} pt)</span>}
            </div>
        </div>
     </>
  );

  if (selectedElements.length === 0) {
    return (
      <div className="bg-slate-800 p-4 text-slate-400 w-64 h-full border-l border-slate-700 overflow-y-auto">
        {renderPageSettings()}
      </div>
    );
  }
  
  if (selectedElements.length > 1) {
    return (
      <div className="bg-slate-800 p-4 text-slate-300 w-64 h-full border-l border-slate-700 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Múltiples Elementos</h3>
        <p className="text-slate-400 mb-4">{selectedElements.length} elementos seleccionados.</p>
        <div className="flex gap-2">
           <button onClick={onDuplicateElements} title="Duplicar Selección (Ctrl+D)" className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-md flex items-center justify-center gap-2">
              <CopyIcon/> Duplicar
            </button>
            <button onClick={onDeleteElements} title="Eliminar Selección (Supr)" className="flex-1 p-2 bg-red-800 hover:bg-red-700 rounded-md flex items-center justify-center gap-2">
              <TrashIcon/> Eliminar
            </button>
        </div>
      </div>
    );
  }

  const renderCommonProperties = () => (
    <>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-sm font-medium">X</label>
          <input type="number" name="x" value={Math.round(element!.x)} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Y</label>
          <input type="number" name="y" value={Math.round(element!.y)} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
        </div>
      </div>
       <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-sm font-medium">Ancho</label>
          <input type="number" name="width" value={Math.round(element!.width)} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" disabled={element?.type === 'line'} />
        </div>
         { (element?.type === 'text' || element?.type === 'image' || element?.type === 'placeholder') && 
            <div>
              <label className="block text-sm font-medium">Alto</label>
              <input type="number" name="height" value={Math.round((element as PdfText | PdfImage | PdfPlaceholder).height)} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
            </div>
         }
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Opacidad</label>
        <input type="range" name="opacity" min="0" max="1" step="0.01" value={element!.opacity} onChange={handleChange} className="w-full" />
      </div>
    </>
  );

  const renderTextProperties = (textElement: PdfText) => (
    <>
      <div className="mb-2">
        <label className="block text-sm font-medium">Texto</label>
        <input type="text" name="text" value={textElement.text} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Fuente</label>
        <select name="fontFamily" value={textElement.fontFamily} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1">
          {fontFamilies.map(font => <option key={font} value={font}>{font}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
            <label className="block text-sm font-medium">Tamaño</label>
            <input type="number" name="fontSize" value={textElement.fontSize} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
        </div>
        <div>
            <label className="block text-sm font-medium">Color</label>
            <input type="color" name="color" value={textElement.color} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1 h-8" />
        </div>
      </div>
    </>
  );
  
  const renderLineProperties = (lineElement: PdfLine) => (
      <>
        <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
                <label className="block text-sm font-medium">Fin X</label>
                <input type="number" name="x2" value={Math.round(lineElement.x2)} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
            </div>
            <div>
                <label className="block text-sm font-medium">Fin Y</label>
                <input type="number" name="y2" value={Math.round(lineElement.y2)} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
            </div>
        </div>
         <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
                <label className="block text-sm font-medium">Grosor</label>
                <input type="number" min="0.1" step="0.1" name="strokeWidth" value={lineElement.strokeWidth} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
            </div>
            <div>
                <label className="block text-sm font-medium">Color</label>
                <input type="color" name="strokeColor" value={lineElement.strokeColor} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1 h-8" />
            </div>
        </div>
      </>
  );

  const renderPlaceholderProperties = (placeholder: PdfPlaceholder) => (
     <>
        <div className="mb-2">
            <label className="block text-sm font-medium">Etiqueta</label>
            <input type="text" name="label" value={placeholder.label} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" placeholder="e.g., patientName" />
        </div>
        <div className="mb-2">
            <label className="block text-sm font-medium">Fuente</label>
            <select name="fontFamily" value={placeholder.fontFamily} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1">
                {fontFamilies.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
                <label className="block text-sm font-medium">Tamaño</label>
                <input type="number" name="fontSize" value={placeholder.fontSize} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1" />
            </div>
            <div>
                <label className="block text-sm font-medium">Color</label>
                <input type="color" name="color" value={placeholder.color} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-1 h-8" />
            </div>
        </div>
     </>
  );
  
  return (
    <div className="bg-slate-800 p-4 text-slate-300 w-64 h-full overflow-y-auto border-l border-slate-700">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <h3 className="text-lg font-bold">Propiedades</h3>
        <div className="flex gap-2">
            <button onClick={onDuplicateElements} title="Duplicar (Ctrl+D)" className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">
                <CopyIcon />
            </button>
            <button onClick={onDeleteElements} title="Eliminar (Supr)" className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">
                <TrashIcon />
            </button>
        </div>
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="mb-2">
          <label className="block text-sm font-medium">Tipo</label>
          <span className="text-cyan-400 capitalize">{element!.type}</span>
        </div>
        {renderCommonProperties()}
        {element!.type === 'text' && renderTextProperties(element as PdfText)}
        {element!.type === 'line' && renderLineProperties(element as PdfLine)}
        {element!.type === 'placeholder' && renderPlaceholderProperties(element as PdfPlaceholder)}
      </form>
    </div>
  );
};
