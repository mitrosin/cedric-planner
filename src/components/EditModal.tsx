import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface EditModalProps {
  item: { type: 'task' | 'habit' | 'list'; data: any; context?: 'schedule' | 'tab' } | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  habitColors: Array<{ name: string; dot: string }>;
  defaultHabitColor: string;
}

export const EditModal: React.FC<EditModalProps> = ({
  item,
  onClose,
  onSave,
  habitColors,
  defaultHabitColor
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('emerald');
  const [frequencyType, setFrequencyType] = useState<string>('daily');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  useEffect(() => {
    if (item?.type === 'habit') {
      setSelectedColor(item.data.color || defaultHabitColor || 'emerald');
      setFrequencyType(item.data.frequency_type || 'daily');
    }
    if (item?.data) {
      setStartTime(item.data.start_time || item.data.due_time || item.data.preferred_time || '');
      setEndTime(item.data.end_time || '');
    }
  }, [item, defaultHabitColor]);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartTime(val);
    if (val) {
      const [hours, minutes] = val.split(':');
      if (hours !== undefined && minutes !== undefined) {
        let h = parseInt(hours, 10) + 1;
        if (h >= 24) h -= 24;
        setEndTime(`${h.toString().padStart(2, '0')}:${minutes}`);
      }
    }
  };

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const updatedData: any = Object.fromEntries(formData.entries());
    
    if (item.type === 'habit') {
      updatedData.frequency_detail = formData.getAll('frequency_detail');
      updatedData.color = selectedColor;
    }
    
    await onSave({ ...item.data, ...updatedData });
    setIsSaving(false);
  };

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SHORT_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">{!item.data.id ? 'New' : 'Edit'} {item.type === 'task' ? 'Task' : item.type === 'list' ? 'List' : 'Habit'}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Title</label>
            <input 
              name="title" 
              defaultValue={item.data.title} 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none"
              required 
            />
          </div>

          {item.type === 'task' ? (
            <>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    defaultValue={item.data.date} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none"
                    required 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Priority</label>
                  <select 
                    name="priority" 
                    defaultValue={item.data.priority} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none appearance-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Start Time</label>
                  <input 
                    type="time" 
                    name="start_time" 
                    value={startTime}
                    onChange={handleStartTimeChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">End Time</label>
                  <input 
                    type="time" 
                    name="end_time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none"
                  />
                </div>
              </div>
            </>
          ) : item.type === 'habit' ? (
            <>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date" 
                    name="start_date" 
                    defaultValue={item.data.start_date} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none"
                    required 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Frequency</label>
                  <select 
                    name="frequency_type" 
                    value={frequencyType} 
                    onChange={(e) => setFrequencyType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none appearance-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              {frequencyType === 'weekly' && (
                <div className="flex justify-between mb-1">
                  {WEEKDAYS.map((day, i) => {
                    const isChecked = item.data.frequency_type === 'weekly' && Array.isArray(item.data.frequency_detail) && item.data.frequency_detail.includes(day);
                    return (
                      <label key={day} className="cursor-pointer group">
                        <input type="checkbox" name="frequency_detail" value={day} defaultChecked={isChecked} className="peer hidden" />
                        <div className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-slate-400 peer-checked:bg-slate-900 peer-checked:text-white peer-checked:border-slate-900 transition-colors group-hover:border-slate-300 shadow-sm">
                          {SHORT_DAYS[i]}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Start Time</label>
                  <input 
                    type="time" 
                    name="start_time" 
                    value={startTime}
                    onChange={handleStartTimeChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">End Time</label>
                  <input 
                    type="time" 
                    name="end_time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 font-medium font-sans outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Habit Color</label>
                <div className="flex justify-between items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  {habitColors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all ring-offset-2 cursor-pointer shadow-sm",
                        c.dot,
                        selectedColor === c.name ? "ring-2 ring-slate-900 scale-110" : "opacity-60 hover:opacity-100 shadow-none hover:-translate-y-0.5"
                      )}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <div className="flex gap-3 pt-6">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold disabled:opacity-50 cursor-pointer hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:bg-slate-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
