import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { NoteItem } from '../components/NoteItem';

export interface NotesViewProps {
  notes: any[];
  handleCreateNote: () => void;
  setActiveNoteId: (id: string | null) => void;
  setNoteEditorMode: (mode: 'view' | 'edit') => void;
  setActivePage: (page: any) => void;
  handleDeleteNote: (id: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  handleCreateNote,
  setActiveNoteId,
  setNoteEditorMode,
  setActivePage,
  handleDeleteNote
}) => {
  if (!notes?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-6 fade-in">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center">
          <FileText className="w-10 h-10 opacity-20" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 dark:text-slate-100">No notes yet</p>
          <p className="text-sm font-medium mt-1">Start capturing your thoughts today</p>
        </div>
        <button 
          onClick={handleCreateNote}
          className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Create first note
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-40 fade-in">
      <div className="flex items-center justify-end px-1">
        <button 
          onClick={handleCreateNote}
          className="p-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest hidden sm:inline">New Note</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...(notes || [])].sort((a,b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')).map((note: any) => (
          <NoteItem 
            key={note.id} 
            note={note} 
            onEdit={(id) => { setActiveNoteId(id); setNoteEditorMode('edit'); setActivePage('note-detail'); }}
            onDelete={handleDeleteNote}
          />
        ))}
      </div>
    </div>
  );
};
