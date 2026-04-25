import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface EditBirthdayModalProps {
  birthday: { id: string; name: string; birthDate: string } | null;
  onClose: () => void;
  onSave: (id: string, name: string, birthDate: string) => Promise<void>;
}

export const EditBirthdayModal: React.FC<EditBirthdayModalProps> = ({ birthday, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [month, setMonth] = useState('01');
  const [day, setDay] = useState('01');

  useEffect(() => {
    if (birthday) {
      setName(birthday.name);
      if (birthday.birthDate) {
        // Handle format 'MM-DD' or 'YYYY-MM-DD'
        let m = '01';
        let d = '01';
        if (birthday.birthDate.length === 10) {
          [, m, d] = birthday.birthDate.split('-');
        } else if (birthday.birthDate.length === 5) {
          [m, d] = birthday.birthDate.split('-');
        }
        setMonth(m || '01');
        setDay(d || '01');
      }
    }
  }, [birthday]);

  if (!birthday) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    const birthDate = `${month}-${day}`;
    await onSave(birthday.id, name.trim(), birthDate);
    setIsSaving(false);
  };

  const daysInMonth = (m: string) => {
    if (['04', '06', '09', '11'].includes(m)) return 30;
    if (m === '02') return 29; // allow 29 for leap years
    return 31;
  };

  const maxDays = daysInMonth(month);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Edit Birthday</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Person's Name</label>
            <input 
              name="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none"
              required 
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Month</label>
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  if (parseInt(day) > daysInMonth(e.target.value)) {
                    setDay(daysInMonth(e.target.value).toString().padStart(2, '0'));
                  }
                }}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none appearance-none"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const m = (i + 1).toString().padStart(2, '0');
                  const mName = new Date(2000, i, 1).toLocaleString('default', { month: 'long' });
                  return <option key={m} value={m}>{mName}</option>;
                })}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Day</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none appearance-none"
              >
                {Array.from({ length: maxDays }, (_, i) => {
                  const d = (i + 1).toString().padStart(2, '0');
                  return <option key={d} value={d}>{d}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold disabled:opacity-50 cursor-pointer hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving || !name.trim()} className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:bg-slate-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
