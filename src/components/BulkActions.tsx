import React from 'react';
import { Check, RotateCcw, Trash2 } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  allDone: boolean;
  allUndone: boolean;
  hasMixed: boolean;
  canDelete: boolean;
  onDeselectAll: () => void;
  onMarkDone: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  allDone,
  allUndone,
  hasMixed,
  canDelete,
  onDeselectAll,
  onMarkDone,
  onRestore,
  onDelete
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="absolute bottom-28 left-4 right-4 bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-[0_8px_30px_-6px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between z-50 animate-in slide-in-from-bottom-4 pointer-events-auto">
      <div className="flex flex-col pl-3">
        <span className="text-sm font-bold tracking-tight">{selectedCount} selected</span>
        <button 
          onClick={onDeselectAll}
          className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white transition-colors text-left cursor-pointer"
        >
          Deselect All
        </button>
      </div>
      <div className="flex bg-slate-800 p-1 rounded-xl">
        {(allUndone || hasMixed) && (
          <button
            onClick={onMarkDone}
            className="flex flex-col items-center justify-center min-w-[3.5rem] py-1 px-2 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer group"
          >
            <Check className="w-4 h-4 mb-0.5 group-hover:text-emerald-400 transition-colors" /> Done
          </button>
        )}
        {(allDone || hasMixed) && (
          <button
            onClick={onRestore}
            className="flex flex-col items-center justify-center min-w-[3.5rem] py-1 px-2 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer group"
          >
            <RotateCcw className="w-4 h-4 mb-0.5 group-hover:text-blue-400 transition-colors" /> Restore
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="flex flex-col items-center justify-center min-w-[3.5rem] py-1 px-2 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer group"
          >
            <Trash2 className="w-4 h-4 mb-0.5 group-hover:text-red-400 transition-colors" /> Delete
          </button>
        )}
      </div>
    </div>
  );
};
