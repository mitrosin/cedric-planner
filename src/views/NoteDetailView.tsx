import React from 'react';
import { ChevronLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { NoteEditor } from '../components/NoteEditor';

export interface NoteDetailViewProps {
  activeNoteId: string | null;
  notes: any[];
  setActivePage: (page: any) => void;
  noteEditDraft: {id: string, title: string, content: string} | null;
  setNoteEditDraft: (draft: {id: string, title: string, content: string} | null) => void;
  handleSaveNote: (id: string, updates: any) => Promise<void>;
  isSavingNote: boolean;
  setIsSavingNote: (val: boolean) => void;
  handleDeleteNote: (id: string) => void;
}

export const NoteDetailView: React.FC<NoteDetailViewProps> = ({
  activeNoteId,
  notes,
  setActivePage,
  noteEditDraft,
  setNoteEditDraft,
  handleSaveNote,
  isSavingNote,
  setIsSavingNote,
  handleDeleteNote
}) => {
  if (!activeNoteId) return null;
  const note = notes?.find(n => n.id === activeNoteId);
  if (!note) {
    setTimeout(() => setActivePage('notes'), 0);
    return null;
  }

  const currentDraft = noteEditDraft || { id: activeNoteId, title: note.title || '', content: note.content || '' };
  const hasChanges = currentDraft.title !== note.title || currentDraft.content !== note.content;

  const performSave = async () => {
    setIsSavingNote(true);
    await handleSaveNote(activeNoteId, { title: currentDraft.title, content: currentDraft.content });
    setIsSavingNote(false);
  };

  return (
    <div className="pb-40 fade-in">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={async () => { 
            if (hasChanges) await performSave();
            setActivePage('notes'); 
            setNoteEditDraft(null); 
          }} 
          className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4"/> Back to Notes
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={performSave}
            disabled={!hasChanges || isSavingNote}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-md",
              hasChanges && !isSavingNote 
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-105 active:scale-95" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50 shadow-none border border-slate-200 dark:border-slate-700"
            )}
          >
            {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSavingNote ? 'Saving...' : 'Save Changes'}
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          <button 
            onClick={() => handleDeleteNote(note.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="relative group mb-6">
          <input 
            type="text" 
            value={currentDraft.title}
            placeholder="Note Title..."
            onChange={(e) => setNoteEditDraft({ ...currentDraft, title: e.target.value })}
            className="text-2xl sm:text-4xl font-black bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 w-full placeholder:text-slate-200 dark:placeholder:text-slate-800 selection:bg-indigo-100 transition-all focus:placeholder:opacity-0 px-2"
          />
          <div className="absolute -bottom-1 left-2 w-12 h-1 bg-indigo-500 rounded-full scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left" />
        </div>
        
        <NoteEditor 
          markdown={currentDraft.content} 
          onChange={(content) => setNoteEditDraft({ ...currentDraft, content })} 
        />
      </div>
    </div>
  );
};
