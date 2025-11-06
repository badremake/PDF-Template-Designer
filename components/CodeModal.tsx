
import React, { useState } from 'react';

interface CodeModalProps {
  code: string;
  onClose: () => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({ code, onClose }) => {
  const [buttonText, setButtonText] = useState('Copy to Clipboard');

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setButtonText('Copied!');
      setTimeout(() => setButtonText('Copy to Clipboard'), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400">Generated Angular PDF Code</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        <div className="p-4 overflow-auto">
          <pre className="bg-slate-900 rounded-md p-4 text-sm whitespace-pre-wrap break-words">
            <code>{code}</code>
          </pre>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end gap-4">
          <button onClick={handleCopy} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
            {buttonText}
          </button>
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
