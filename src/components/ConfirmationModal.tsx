import React from 'react';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate-500 mb-8 font-medium leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-[0_8px_20px_-6px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
