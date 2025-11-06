import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PdfElement, PdfElementType, PageSettings, DesignFile, PdfPlaceholder, PdfText, PdfImage } from './types';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ElementList } from './components/ElementList';
import { CodeModal } from './components/CodeModal';
import { fileToBase64, triggerDownload } from './utils/fileUtils';

// Letter page dimensions in points (pt)
const LETTER_WIDTH_PT = 612;
const LETTER_HEIGHT_PT = 792;

const generateCodeForAngular = (elements: PdfElement[], pageSettings: PageSettings, placeholders: PdfPlaceholder[]): string => {
  const interfaceName = 'PdfData';
  let dataInterface = `export interface ${interfaceName} {\n`;
  placeholders.forEach(p => {
    dataInterface += `  ${p.label}: string;\n`;
  });
  dataInterface += `}\n\n`;
  if (placeholders.length === 0) {
      dataInterface = ''; // Don't generate interface if no placeholders
  }

  const hasAsync = elements.some(el => el.type === 'image');
  const functionSignature = `generatePdf(${placeholders.length > 0 ? `data: ${interfaceName}` : ''})${hasAsync ? ': Promise<void>' : ': void'}`;

  let functionBody = `
import jsPDF from 'jspdf';

${dataInterface}
// npm install jspdf
// Make sure to have a version of jsPDF that supports addImage with base64 strings if you use images.

export ${hasAsync ? 'async' : ''} function ${functionSignature} {
  const doc = new jsPDF({
    orientation: '${pageSettings.width > pageSettings.height ? 'landscape' : 'portrait'}',
    unit: '${pageSettings.unit}',
    format: [${pageSettings.width}, ${pageSettings.height}]
  });

`;

  elements.forEach(el => {
    functionBody += `  // Element: ${el.type} (${el.id.substring(0, 8)})\n`;
    functionBody += `  doc.setGState(new doc.GState({opacity: ${el.opacity}}));\n`;
    switch (el.type) {
      case 'text':
        functionBody += `  doc.setFont('${el.fontFamily}');\n`;
        functionBody += `  doc.setFontSize(${el.fontSize});\n`;
        functionBody += `  doc.setTextColor('${el.color}');\n`;
        functionBody += `  doc.text(\`${el.text}\`, ${el.x}, ${el.y + el.fontSize * 0.75}, { maxWidth: ${el.width} });\n\n`;
        break;
      case 'image':
        functionBody += `  doc.addImage('${el.src}', 'JPEG', ${el.x}, ${el.y}, ${el.width}, ${(el as PdfImage).height});\n\n`;
        break;
      case 'line':
        functionBody += `  doc.setLineWidth(${el.strokeWidth});\n`;
        functionBody += `  doc.setDrawColor('${el.strokeColor}');\n`;
        functionBody += `  doc.line(${el.x}, ${el.y}, ${el.x2}, ${el.y2});\n\n`;
        break;
      case 'placeholder':
        functionBody += `  doc.setFont('${el.fontFamily}');\n`;
        functionBody += `  doc.setFontSize(${el.fontSize});\n`;
        functionBody += `  doc.setTextColor('${el.color}');\n`;
        functionBody += `  doc.text(data.${el.label}, ${el.x}, ${el.y + el.fontSize * 0.75}, { maxWidth: ${el.width} });\n\n`;
        break;
    }
  });

  functionBody += `
  doc.save('generated-document.pdf');
}
`;
  return functionBody.trim();
};


const App: React.FC = () => {
  const [elements, setElements] = useState<PdfElement[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [pageSettings, setPageSettings] = useState<PageSettings>({ width: LETTER_WIDTH_PT, height: LETTER_HEIGHT_PT, unit: 'pt' });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);

  const handleAddElement = useCallback(async (type: PdfElementType) => {
    const id = uuidv4();
    let newElement: PdfElement | null = null;

    switch (type) {
      case 'text':
        newElement = { id, type: 'text', x: 50, y: 50, width: 200, height: 20, opacity: 1, text: 'New Text', fontSize: 16, fontFamily: 'Helvetica', color: '#000000' };
        break;
      case 'image':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const src = await fileToBase64(file);
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const imageElement: PdfElement = { id, type: 'image', x: 100, y: 100, width: 150, height: 150 / aspectRatio, opacity: 1, src };
                setElements(prev => [...prev, imageElement]);
                setSelectedElementIds([id]);
            };
            img.src = src;
          }
        };
        input.click();
        return;
      case 'line':
        newElement = { id, type: 'line', x: 150, y: 150, width: 100, height: 0, x2: 250, y2: 150, opacity: 1, strokeWidth: 1, strokeColor: '#000000' };
        break;
      case 'placeholder':
        newElement = { id, type: 'placeholder', label: 'newPlaceholder', x: 200, y: 200, width: 180, height: 30, opacity: 1, fontSize: 14, fontFamily: 'Helvetica', color: '#000000' };
        break;
    }
    if (newElement) {
        setElements(prev => [...prev, newElement]);
        setSelectedElementIds([id]);
    }
  }, []);
  
  const handleSelectElements = useCallback((ids: string[], append: boolean) => {
    if (append) {
        setSelectedElementIds(prev => {
            const newSelection = [...prev];
            ids.forEach(id => {
                const index = newSelection.indexOf(id);
                if (index > -1) newSelection.splice(index, 1);
                else newSelection.push(id);
            });
            return newSelection;
        });
    } else {
        setSelectedElementIds(ids);
    }
  }, []);

  const handleUpdateElement = useCallback((updatedElement: PdfElement) => {
    setElements(prev => prev.map(el => (el.id === updatedElement.id ? updatedElement : el)));
  }, []);

  const handleUpdateElements = useCallback((updatedElements: PdfElement[]) => {
    const updatedIds = new Set(updatedElements.map(ue => ue.id));
    setElements(prev => [
        ...prev.filter(el => !updatedIds.has(el.id)),
        ...updatedElements
    ]);
  }, []);
  
  const handleDeleteElements = useCallback(() => {
    setElements(prev => prev.filter(el => !selectedElementIds.includes(el.id)));
    setSelectedElementIds([]);
  }, [selectedElementIds]);

  const handleDuplicateElements = useCallback(() => {
    const newElements: PdfElement[] = [];
    const newSelectedIds: string[] = [];
    elements.forEach(el => {
      if (selectedElementIds.includes(el.id)) {
        const newId = uuidv4();
        const duplicatedElement = { ...el, id: newId, x: el.x + 10, y: el.y + 10, ...('x2' in el && {x2: el.x2 + 10}), ...('y2' in el && {y2: el.y2 + 10}) };
        newElements.push(duplicatedElement);
        newSelectedIds.push(newId);
      }
    });
    setElements(prev => [...prev, ...newElements]);
    setSelectedElementIds(newSelectedIds);
  }, [elements, selectedElementIds]);

  const handleSaveDesign = () => {
    const design: DesignFile = { pageSettings, elements };
    const designString = JSON.stringify(design, null, 2);
    triggerDownload(designString, 'pdf-design.json', 'application/json');
  };

  const handleLoadDesign = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const design = JSON.parse(event.target?.result as string) as DesignFile;
          if (design.pageSettings && design.elements) {
            setPageSettings(design.pageSettings);
            setElements(design.elements);
            setSelectedElementIds([]);
          } else { throw new Error('Invalid design file format.'); }
        } catch (error) {
          alert(`Error loading design file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset file input
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            handleDeleteElements();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            handleDuplicateElements();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteElements, handleDuplicateElements]);

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-white font-sans">
      <Toolbar onAddElement={handleAddElement} onSave={handleSaveDesign} onLoad={handleLoadDesign} />
      <div className="flex flex-col flex-grow">
        <header className="bg-slate-800 p-2 flex justify-between items-center border-b border-slate-700">
          <h1 className="text-xl font-bold text-cyan-400">PDF Template Designer</h1>
           <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Zoom:</span>
              <input
                type="range"
                min="0.2"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 accent-cyan-600"
              />
              <span className="text-sm w-12 text-right">{Math.round(zoom * 100)}%</span>
            </div>
            <button
              onClick={() => {
                const placeholders = elements.filter(el => el.type === 'placeholder') as PdfPlaceholder[];
                const code = generateCodeForAngular(elements, pageSettings, placeholders);
                setGeneratedCode(code);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Export Angular Code
            </button>
          </div>
        </header>
        <div className="flex flex-grow overflow-hidden">
          <ElementList elements={elements} selectedElementIds={selectedElementIds} onSelectElements={handleSelectElements} />
          <main className="flex-grow bg-slate-700 flex items-center justify-center p-4 overflow-auto">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} className="transition-transform duration-100">
              <Canvas
                elements={elements}
                selectedElementIds={selectedElementIds}
                onSelectElements={handleSelectElements}
                onUpdateElement={handleUpdateElement}
                onUpdateElements={handleUpdateElements}
                pageSettings={pageSettings}
              />
            </div>
          </main>
          <PropertiesPanel 
            selectedElements={elements.filter(el => selectedElementIds.includes(el.id))} 
            onUpdateElement={handleUpdateElement}
            onDuplicateElements={handleDuplicateElements}
            onDeleteElements={handleDeleteElements}
            pageSettings={pageSettings}
            onUpdatePageSettings={setPageSettings}
          />
        </div>
      </div>
      {generatedCode && <CodeModal code={generatedCode} onClose={() => setGeneratedCode(null)} />}
    </div>
  );
};

export default App;
