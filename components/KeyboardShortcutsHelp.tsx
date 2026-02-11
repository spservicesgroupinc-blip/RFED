import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutItem: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-slate-400 text-xs mx-1">+</span>}
            <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-700 shadow-sm min-w-[28px] text-center">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const KeyboardShortcutsHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Keyboard Shortcuts</h2>
                <p className="text-sm text-slate-300 mt-1">Speed up your workflow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Navigation Section */}
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Navigation</h3>
            <div className="space-y-0">
              <ShortcutItem keys={['Ctrl', 'D']} description="Go to Dashboard" />
              <ShortcutItem keys={['Ctrl', 'N']} description="New Estimate" />
              <ShortcutItem keys={['Ctrl', 'Shift', 'C']} description="View Customers" />
              <ShortcutItem keys={['Ctrl', 'Shift', 'W']} description="Open Warehouse" />
              <ShortcutItem keys={['Ctrl', ',']} description="Open Settings" />
            </div>
          </div>

          {/* Actions Section */}
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Actions</h3>
            <div className="space-y-0">
              <ShortcutItem keys={['Ctrl', 'S']} description="Save Current Work" />
              <ShortcutItem keys={['Ctrl', 'K']} description="Quick Search" />
              <ShortcutItem keys={['Esc']} description="Close Modal/Cancel" />
            </div>
          </div>

          {/* Help Section */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Help</h3>
            <div className="space-y-0">
              <ShortcutItem keys={['Shift', '?']} description="Show this help" />
            </div>
          </div>

          {/* Tip */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-800">
              <strong>💡 Pro Tip:</strong> On Mac, use <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-xs">⌘</kbd> instead of <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-xs">Ctrl</kbd>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
