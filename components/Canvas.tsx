import React, { useState, useRef, MouseEvent, useCallback, useEffect } from 'react';
import { PdfElement, PdfText, PdfImage, PdfLine, PdfPlaceholder, PageSettings } from '../types';

type InteractionState = 
    | { type: 'idle' }
    | { type: 'dragging', startX: number, startY: number, initialStates: { id: string, x: number, y: number, x2?: number, y2?: number }[] }
    | { type: 'resizing', element: PdfElement, handle: string, startX: number, startY: number };

const renderElement = (element: PdfElement) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    opacity: element.opacity,
    boxSizing: 'border-box',
    pointerEvents: 'none', // Pass clicks through to the selection div
  };

  switch (element.type) {
    case 'text': {
      const el = element as PdfText;
      return <div style={{ ...style, height: `${el.height}px`, color: el.color, fontFamily: el.fontFamily, fontSize: `${el.fontSize}px`, overflow: 'hidden', whiteSpace: 'pre-wrap', lineHeight: 1.2 }}>{el.text}</div>;
    }
    case 'image': {
      const el = element as PdfImage;
      return <img src={el.src} alt="pdf element" style={{ ...style, height: `${el.height}px`, objectFit: 'fill' }} />;
    }
    case 'line': {
        const el = element as PdfLine;
        const angle = Math.atan2(el.y2 - el.y, el.x2 - el.x) * 180 / Math.PI;
        const length = Math.sqrt(Math.pow(el.x2 - el.x, 2) + Math.pow(el.y2 - el.y, 2));
        return <div style={{ ...style, width: `${length}px`, height: `${el.strokeWidth}px`, background: el.strokeColor, transform: `rotate(${angle}deg)`, transformOrigin: '0 0' }} />;
    }
    case 'placeholder': {
      const el = element as PdfPlaceholder;
       return <div style={{ ...style, height: `${el.height}px`, border: '2px dashed #0891b2', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }} ><span>{el.label}</span></div>;
    }
    default:
      return null;
  }
};

const RESIZE_HANDLES = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
const LINE_RESIZE_HANDLES = ['start', 'end'];

interface CanvasProps {
  elements: PdfElement[];
  selectedElementIds: string[];
  onSelectElements: (ids: string[], append: boolean) => void;
  onUpdateElement: (element: PdfElement) => void;
  onUpdateElements: (elements: PdfElement[]) => void;
  pageSettings: PageSettings;
}

export const Canvas: React.FC<CanvasProps> = ({ elements, selectedElementIds, onSelectElements, onUpdateElement, onUpdateElements, pageSettings }) => {
  const [interaction, setInteraction] = useState<InteractionState>({ type: 'idle' });
  const canvasRef = useRef<HTMLDivElement>(null);

  const getElementById = useCallback((id: string) => elements.find(el => el.id === id), [elements]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, elementId: string, handle?: string) => {
    e.stopPropagation();
    const element = getElementById(elementId);
    if (!element || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const isSelected = selectedElementIds.includes(elementId);
    if (!isSelected) {
      onSelectElements([elementId], e.shiftKey);
    }
    
    // The selection for dragging should be based on the CURRENT selection state if the clicked element is already selected,
    // otherwise it's just the newly clicked element (which becomes selected asynchronously).
    const elementIdsToDrag = isSelected ? selectedElementIds : [elementId];

    if (handle) {
        setInteraction({ type: 'resizing', element, handle, startX, startY });
    } else {
        const selectedElements = elements.filter(el => elementIdsToDrag.includes(el.id));
        const initialStates = selectedElements.map(el => {
            if (el.type === 'line') {
                return { id: el.id, x: el.x, y: el.y, x2: el.x2, y2: el.y2 };
            }
            return { id: el.id, x: el.x, y: el.y };
        });
        setInteraction({ type: 'dragging', startX, startY, initialStates });
    }
  };

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (interaction.type === 'idle' || !canvasRef.current) return;
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (interaction.type === 'dragging') {
        const dx = mouseX - interaction.startX;
        const dy = mouseY - interaction.startY;

        const updatedElements = interaction.initialStates.map(initialState => {
            const el = getElementById(initialState.id)!;
            if (el.type === 'line') {
                 const lineInitial = initialState as { id: string, x: number, y: number, x2: number, y2: number };
                 return { ...el, x: lineInitial.x + dx, y: lineInitial.y + dy, x2: lineInitial.x2 + dx, y2: lineInitial.y2 + dy };
            }
            return { ...el, x: initialState.x + dx, y: initialState.y + dy };
        });
        onUpdateElements(updatedElements);
    }

    if (interaction.type === 'resizing') {
        const { element: originalElement, handle, startX, startY } = interaction;
        const dx = mouseX - startX;
        const dy = mouseY - startY;

        if (originalElement.type === 'line') {
            const line = originalElement;
            if (handle === 'start') {
                onUpdateElement({ ...line, x: line.x + dx, y: line.y + dy });
            } else if (handle === 'end') {
                onUpdateElement({ ...line, x2: line.x2 + dx, y2: line.y2 + dy });
            }
            // Update interaction state to reflect the latest mouse position for smooth continuous resizing
            setInteraction(prev => ({...prev, startX: mouseX, startY: mouseY, element: {...line, x: line.x + dx, y: line.y + dy}} as InteractionState));
        } else {
            let { x, y, width, height } = originalElement as PdfText | PdfImage | PdfPlaceholder;
            
            let newX = x;
            let newY = y;
            let newWidth = width;
            let newHeight = height;

            if (handle.includes('e')) { newWidth = originalElement.width + dx; }
            if (handle.includes('w')) { newWidth = originalElement.width - dx; newX = originalElement.x + dx; }
            if (handle.includes('s')) { newHeight = (originalElement as any).height + dy; }
            if (handle.includes('n')) { newHeight = (originalElement as any).height - dy; newY = originalElement.y + dy; }
            
            if (newWidth < 10) {
                if (handle.includes('w')) newX = originalElement.x + originalElement.width - 10;
                newWidth = 10;
            }
            if (newHeight < 10) {
                if (handle.includes('n')) newY = originalElement.y + (originalElement as any).height - 10;
                newHeight = 10;
            }

            onUpdateElement({ ...originalElement, x: newX, y: newY, width: newWidth, height: newHeight });
        }
    }
  }, [interaction, getElementById, onUpdateElement, onUpdateElements]);

  const handleMouseUp = useCallback(() => {
    if (interaction.type !== 'idle') {
        setInteraction({ type: 'idle' });
    }
  }, [interaction.type]);

  useEffect(() => {
    if (interaction.type !== 'idle') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction.type, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={canvasRef}
      className="relative bg-white shadow-lg overflow-hidden"
      style={{ width: `${pageSettings.width}pt`, height: `${pageSettings.height}pt`, cursor: interaction.type === 'dragging' ? 'grabbing' : 'default' }}
      onClick={(e) => { if (e.target === e.currentTarget) onSelectElements([], false); }}
      onMouseUp={handleMouseUp} // Added to catch mouse up events on the canvas itself
    >
      {elements.map((element) => {
        const isSelected = selectedElementIds.includes(element.id);
        const isLine = element.type === 'line';
        const line = isLine ? element as PdfLine : null;
        
        // Bounding box calculation
        const boxX = isLine ? Math.min(line!.x, line!.x2) : element.x;
        const boxY = isLine ? Math.min(line!.y, line!.y2) : element.y;
        const boxWidth = isLine ? Math.abs(line!.x - line!.x2) : element.width;
        const boxHeight = isLine ? Math.abs(line!.y - line!.y2) : (element as any).height;
        
        return (
          <div key={element.id} >
            {/* Rendered element */}
            {renderElement(element)}
            
            {/* Interaction layer */}
            <div onMouseDown={(e) => handleMouseDown(e, element.id)} style={{ position: 'absolute', left: boxX, top: boxY, width: boxWidth, height: boxHeight, cursor: 'move', zIndex: 1 }}/>
            
            {/* Selection UI */}
            {isSelected && (
              <>
                <div style={{ position: 'absolute', left: boxX, top: boxY, width: boxWidth, height: boxHeight, border: '1px solid #0ea5e9', pointerEvents: 'none', zIndex: 10 }}/>
                { (isLine ? LINE_RESIZE_HANDLES : RESIZE_HANDLES).map(handle => {
                    let posStyle: React.CSSProperties = { zIndex: 11 };
                    if(isLine) {
                         posStyle = {
                            ...posStyle,
                            left: handle === 'start' ? line!.x - 4 : line!.x2 - 4,
                            top: handle === 'start' ? line!.y - 4 : line!.y2 - 4,
                            cursor: 'pointer'
                         };
                    } else {
                        const cursor = `${handle}-resize`;
                        const el = element as PdfText | PdfImage | PdfPlaceholder;
                        if(handle.includes('n')) posStyle.top = el.y - 4;
                        if(handle.includes('s')) posStyle.top = el.y + el.height - 4;
                        if(handle.includes('w')) posStyle.left = el.x - 4;
                        if(handle.includes('e')) posStyle.left = el.x + el.width - 4;
                        if(handle === 'n' || handle === 's') { posStyle.left = el.x + el.width / 2 - 4; }
                        if(handle === 'w' || handle === 'e') { posStyle.top = el.y + el.height / 2 - 4; }
                        if(handle === 'nw') { posStyle.left = el.x - 4; posStyle.top = el.y - 4; }
                        if(handle === 'ne') { posStyle.left = el.x + el.width - 4; posStyle.top = el.y - 4; }
                        if(handle === 'sw') { posStyle.left = el.x - 4; posStyle.top = el.y + el.height - 4; }
                        if(handle === 'se') { posStyle.left = el.x + el.width - 4; posStyle.top = el.y + el.height - 4; }
                        posStyle.cursor = cursor;
                    }
                    return (
                        <div key={handle} onMouseDown={(e) => handleMouseDown(e, element.id, handle)} style={{ position: 'absolute', ...posStyle, width: '8px', height: '8px', background: 'white', border: '1px solid #0ea5e9', borderRadius: '50%'}} />
                    )
                })}
              </>
            )}
          </div>
        )
      })}
    </div>
  );
};
