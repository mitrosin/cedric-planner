import React from 'react';
import { Sparkles, Calendar, CheckSquare, Repeat, Clock, RotateCcw, Trash2, LogOut, X, Settings, FileText, Cake, List, Info, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

type AppPage = 'schedule' | 'tasks' | 'habits' | 'unfinished' | 'settings' | 'lists' | 'notes' | 'note-detail' | 'birthdays' | 'about' | 'docs';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  activePage: AppPage;
  onPageSelect: (page: AppPage) => void;
  onLogout: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  isOpen,
  onClose,
  user,
  activePage,
  onPageSelect,
  onLogout
}) => {
  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex transition-all duration-300 lg:relative lg:inset-auto lg:z-auto lg:flex",
      isOpen ? "opacity-100 pointer-events-auto visible" : "opacity-0 pointer-events-none invisible delay-300 lg:opacity-100 lg:pointer-events-auto lg:visible lg:delay-0"
    )}>
      <div 
        className={cn(
          "absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0"
        )} 
        onClick={onClose} 
      />
      <div 
        className={cn(
          "relative w-[280px] h-full bg-slate-50 shadow-2xl lg:shadow-none lg:border-r border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 lg:bg-transparent">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100">Cedric Planner</span>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 cursor-pointer bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <button 
            onClick={() => { onPageSelect('settings'); onClose(); }}
            className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center font-bold overflow-hidden shrink-0">
              {user?.photoURL 
                ? <img src={user.photoURL} className="w-full h-full object-cover" /> 
                : <span className="text-slate-600">{user?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-slate-500 truncate font-medium">{user?.email}</p>
            </div>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
          <div>
            <p className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planner</p>
            <div className="space-y-1">
              <button 
                onClick={() => { onPageSelect('schedule'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'schedule' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <Calendar className="w-4 h-4" /> Schedule
              </button>
              <button 
                onClick={() => { onPageSelect('tasks'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'tasks' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <CheckSquare className="w-4 h-4" /> Tasks
              </button>
              <button 
                onClick={() => { onPageSelect('habits'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'habits' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <Repeat className="w-4 h-4" /> Habits
              </button>
              <button 
                onClick={() => { onPageSelect('unfinished'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'unfinished' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <Clock className="w-4 h-4" /> Unfinished
              </button>
            </div>
          </div>

          <div>
            <p className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</p>
            <div className="space-y-1">
              <button 
                onClick={() => { onPageSelect('lists'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'lists' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <List className="w-4 h-4" /> Lists
              </button>
              <button 
                onClick={() => { onPageSelect('notes'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'notes' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <FileText className="w-4 h-4" /> Notes
              </button>
            </div>
          </div>

          <div>
            <p className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal</p>
            <div className="space-y-1">
              <button 
                onClick={() => { onPageSelect('birthdays'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'birthdays' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <Cake className="w-4 h-4" /> Birthdays
              </button>
            </div>
          </div>

          <div>
            <p className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings & Info</p>
            <div className="space-y-1">
              <button 
                onClick={() => { onPageSelect('settings'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'settings' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button 
                onClick={() => { onPageSelect('docs'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'docs' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <BookOpen className="w-4 h-4" /> Documentation
              </button>
              <button 
                onClick={() => { onPageSelect('about'); onClose(); }}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer", activePage === 'about' ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700")}
              >
                <Info className="w-4 h-4" /> About
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200/60 bg-white">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};
