import React from 'react';
import { FileText, Trash2, Eye, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';

interface NoteItemProps {
  note: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note, onEdit, onDelete }) => {
  const formatDateStr = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      return format(parseISO(dateStr), 'd MMM yyyy, HH:mm');
    } catch {
      return dateStr;
    }
  };

  return (
    <div 
      className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative group cursor-pointer"
      onClick={() => onEdit(note.id)}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(note.id); }} 
          className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 rounded-xl cursor-pointer transition-all hover:shadow-sm bg-white dark:bg-slate-800"
          title="Edit Note"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} 
          className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer transition-all hover:shadow-sm bg-white dark:bg-slate-800"
          title="Delete Note"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start gap-4 mb-3">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 pr-24 break-words leading-tight">{note.title || 'Untitled Note'}</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Last updated: {formatDateStr(note.updatedAt || note.createdAt)}
          </p>
        </div>
      </div>
      
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-2 pr-4">
        {note.content?.replace(/[#*`]/g, '').slice(0, 150) || 'No content yet...'}
      </div>
    </div>
  );
};
