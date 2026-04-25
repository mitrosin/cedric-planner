import React from 'react';
import { Cake, Trash2, Edit2 } from 'lucide-react';
import { format, parse } from 'date-fns';

interface BirthdayItemProps {
  birthday: {
    id: string;
    name: string;
    birthDate: string; // MM-DD or YYYY-MM-DD
  };
  onEdit: (birthday: any) => void;
  onDelete: (id: string) => void;
}

export const BirthdayItem: React.FC<BirthdayItemProps> = ({ birthday, onEdit, onDelete }) => {
  const getDisplayDate = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      
      let date: Date;
      if (dateStr.length === 5) {
        // MM-DD
        date = parse(dateStr, 'MM-dd', new Date());
      } else {
        // YYYY-MM-DD
        date = parse(dateStr, 'yyyy-MM-dd', new Date());
      }
      
      return format(date, 'd MMMM');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/30 rounded-xl flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
          <Cake className="w-5 h-5" />
        </div>
        
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 break-words leading-tight text-sm">{birthday.name}</h3>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
            {getDisplayDate(birthday.birthDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button 
          onClick={() => onEdit(birthday)}
          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all cursor-pointer"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(birthday.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
