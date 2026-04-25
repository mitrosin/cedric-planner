import React from 'react';
import { User, Loader2, Cake, Edit2, Trash2, Plus } from 'lucide-react';
import { BirthdayItem } from '../components/BirthdayItem';

export interface BirthdaysViewProps {
  birthdays: any[];
  handleSaveBirthday: (e: React.FormEvent) => Promise<void>;
  birthdayName: string;
  setBirthdayName: (name: string) => void;
  birthdayMonth: string;
  setBirthdayMonth: (month: string) => void;
  birthdayDay: string;
  setBirthdayDay: (day: string) => void;
  isSubmittingBirthday: boolean;
  handleEditBirthday: (birthday: any) => void;
  handleDeleteBirthday: (id: string, name: string) => void;
}

export const BirthdaysView: React.FC<BirthdaysViewProps> = ({
  birthdays,
  handleSaveBirthday,
  birthdayName,
  setBirthdayName,
  birthdayMonth,
  setBirthdayMonth,
  birthdayDay,
  setBirthdayDay,
  isSubmittingBirthday,
  handleEditBirthday,
  handleDeleteBirthday
}) => {
  const months = [
    { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
    { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
    { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
    { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' }
  ];
  
  // Generate days 01-31
  const daysArr = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  const sortedBirthdays = [...(birthdays || [])].sort((a, b) => {
    const getSortVal = (dateStr: string) => {
      if (!dateStr || dateStr.length === 5) return dateStr || ''; // MM-DD
      return dateStr.substring(5); // YYYY-MM-DD -> MM-DD
    };
    return getSortVal(a.birthDate).localeCompare(getSortVal(b.birthDate));
  });

  return (
    <div className="space-y-8 pb-40 fade-in">
      {/* Add Birthday Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          Add New Birthday
        </h3>
        <form onSubmit={handleSaveBirthday} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Person's Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={birthdayName}
                onChange={(e) => setBirthdayName(e.target.value)}
                placeholder="e.g. John Doe" 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                required
              />
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-36 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Month</label>
              <select 
                value={birthdayMonth}
                onChange={(e) => setBirthdayMonth(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium cursor-pointer"
              >
                {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div className="flex-1 sm:w-24 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Day</label>
              <select 
                value={birthdayDay}
                onChange={(e) => setBirthdayDay(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium cursor-pointer"
              >
                {daysArr.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              type="submit" 
              disabled={!birthdayName.trim() || isSubmittingBirthday}
              className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-md cursor-pointer"
            >
              {isSubmittingBirthday ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Birthdays List View */}
      <div className="space-y-3">
        {sortedBirthdays.length === 0 ? (
          <div className="w-full py-12 text-center text-slate-400 font-medium bg-white/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            No birthdays recorded yet.
          </div>
        ) : (
          sortedBirthdays.map(b => (
            <BirthdayItem 
              key={b.id} 
              birthday={b} 
              onEdit={(b) => handleEditBirthday(b)}
              onDelete={(id) => handleDeleteBirthday(id, b.name)} 
            />
          ))
        )}
      </div>
    </div>
  );
};
