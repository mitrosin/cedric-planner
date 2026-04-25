import React from 'react';
import { Check, Edit2, Trash2, Calendar, Clock, Repeat } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { HabitHeatmap } from './HabitHeatmap';

interface HabitItemProps {
  habit: any;
  isSelected: boolean;
  isDone?: boolean;
  colorConfig: any;
  hideBorder?: boolean;
  hideTime?: boolean;
  hideFrequency?: boolean;
  strikethrough?: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: (type: 'task' | 'habit', data: any, context: 'schedule' | 'tab') => void;
  onDelete: (type: 'task' | 'habit', id: string, context: 'schedule' | 'tab') => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({
  habit,
  isSelected,
  isDone,
  colorConfig,
  hideBorder,
  hideTime,
  hideFrequency,
  strikethrough,
  onToggleSelection,
  onEdit,
  onDelete
}) => {
  const formatDateStr = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SHORT_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className={cn(
      "flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md",
      colorConfig.bg,
      !hideBorder && "border border-slate-200",
      isSelected && `ring-1 ${colorConfig.ring} border-transparent`
    )}>
      <div className="flex flex-col items-center gap-2 mt-1">
        <button
          onClick={() => onToggleSelection(habit.id)}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-sm",
            (isSelected || isDone) ? `${colorConfig.dot} border-transparent text-white` : "bg-white border-slate-300 hover:border-slate-400"
          )}
        >
          {(isSelected || isDone) && <Check className="w-4 h-4" />}
        </button>
        {(habit.start_time || habit.preferred_time) && !hideTime && <span className="text-[10px] font-bold opacity-50 whitespace-nowrap">{habit.start_time || habit.preferred_time}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Repeat className={cn("w-5 h-5 shrink-0 transition-opacity", colorConfig.text, isSelected && "opacity-40")} />
            <h4 className={cn("font-semibold text-slate-900 break-words pr-2 leading-tight transition-all", isSelected && "opacity-40", (isDone && strikethrough) && "line-through", isDone && "opacity-40")}>{habit.title}</h4>
          </div>
          {!isSelected && !isDone && (
            <div className="flex items-center gap-3 text-slate-400 shrink-0">
              <button 
                onClick={() => onEdit('habit', habit, 'tab')} 
                className="p-2 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-blue-500 rounded-xl cursor-pointer transition-all hover:shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete('habit', habit.id, 'tab')} 
                className="p-2 border border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer transition-all hover:shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5" /> {formatDateStr(habit.start_date)}
          </span>
          {(habit.start_time || habit.preferred_time) && !hideTime && (
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" /> {habit.start_time || habit.preferred_time}{habit.end_time && ` - ${habit.end_time}`}
            </span>
          )}
          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg capitalize">
            {habit.frequency_type}
          </span>
          <span className="bg-slate-50 px-2 py-1 rounded-lg">
            {habit.estimated_duration_minutes}m
          </span>
        </div>

        {!hideFrequency && (habit.frequency_type === 'daily' || habit.frequency_type === 'weekly') && (
          <div className="flex gap-1.5 mt-4">
            {WEEKDAYS.map((day, i) => {
              let isActive = false;
              if (habit.frequency_type === 'daily') isActive = true;
              else if (habit.frequency_type === 'weekly' && Array.isArray(habit.frequency_detail)) {
                isActive = habit.frequency_detail.includes(day);
              }
              return (
                <div key={day} className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 transition-colors",
                  isActive ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-400 ring-slate-200"
                )}>
                  {SHORT_DAYS[i]}
                </div>
              );
            })}
          </div>
        )}

        {!hideFrequency && (
          <HabitHeatmap habit={habit} />
        )}
      </div>
    </div>
  );
};
