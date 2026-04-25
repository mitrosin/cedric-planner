import React from 'react';
import { Check, Edit2, Trash2, Calendar, Clock, CheckSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';

interface TaskItemProps {
  task: any;
  isSelected: boolean;
  isDone: boolean;
  isUnfinishedView?: boolean;
  hideBorder?: boolean;
  hideTime?: boolean;
  strikethrough?: boolean;
  onToggleSelection: (id: string, date: string) => void;
  onEdit: (type: 'task' | 'habit', data: any, context: 'schedule' | 'tab') => void;
  onDelete: (type: 'task' | 'habit', id: string, context: 'schedule' | 'tab') => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isSelected,
  isDone,
  isUnfinishedView,
  hideBorder,
  hideTime,
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

  if (isUnfinishedView) {
    return (
      <div className={cn(
        "flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer bg-white",
        isSelected ? "border-red-300 ring-1 ring-red-500" : "border border-slate-200 relative overflow-hidden"
      )}>
        {!isSelected && <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-400" />}
        <div className="flex flex-col items-center gap-2 mt-1 z-10">
          <button
            onClick={() => onToggleSelection(task.id, task.date)}
            className={cn(
              "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-sm bg-white",
              isSelected ? "bg-red-500 border-red-500 text-white" : "border-slate-300 hover:border-slate-400"
            )}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </button>
          {(task.start_time || task.due_time) && <span className="text-[10px] font-bold text-red-500 whitespace-nowrap">{task.start_time || task.due_time}{task.end_time && ` - ${task.end_time}`}</span>}
        </div>
        <div className="flex-1 z-10 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CheckSquare className="w-5 h-5 text-blue-500 shrink-0" />
              <h4 className={cn("font-semibold text-slate-900 break-words pr-2 leading-tight")}>{task.title}</h4>
            </div>
            <div className="flex items-center gap-3 text-slate-400 shrink-0">
              <button 
                onClick={() => onEdit('task', task, 'tab')} 
                className="p-2 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-blue-500 rounded-xl cursor-pointer transition-all hover:shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete('task', task.id, 'tab')} 
                className="p-2 border border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer transition-all hover:shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5" /> {formatDateStr(task.date)}
            </span>
            {task.due_time && (
              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" /> {task.due_time}
              </span>
            )}
            <span className={cn(
              "px-2 py-1 rounded-lg capitalize",
              task.priority === 'high' && "bg-red-50 text-red-700",
              task.priority === 'medium' && "bg-orange-50 text-orange-700",
              task.priority === 'low' && "bg-blue-50 text-blue-700"
            )}>
              {task.priority} Priority
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl transition-all cursor-pointer bg-white shadow-sm hover:shadow-md",
      !hideBorder && "border border-slate-200",
      isSelected && "ring-1 ring-slate-900 border-slate-900"
    )}>
      <div className="flex flex-col items-center gap-2 mt-1">
        <button
          onClick={() => onToggleSelection(task.id, task.date)}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-sm",
            (isSelected || isDone) ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-300 hover:border-slate-400"
          )}
        >
          {(isSelected || isDone) && <Check className="w-4 h-4" />}
        </button>
        {(task.start_time || task.due_time) && !hideTime && <span className="text-[10px] font-bold opacity-50 whitespace-nowrap">{task.start_time || task.due_time}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CheckSquare className={cn("w-5 h-5 text-blue-500 shrink-0", isDone && "opacity-40")} />
            <h4 className={cn("font-semibold text-slate-900 break-words pr-2 leading-tight", isDone && "opacity-40", (isDone && strikethrough) && "line-through")}>{task.title}</h4>
          </div>
          {!isDone && (
            <div className="flex items-center gap-3 transition-opacity shrink-0 text-slate-400">
              <button 
                onClick={() => onEdit('task', task, 'tab')} 
                className="p-2 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-blue-500 rounded-xl cursor-pointer transition-all hover:shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete('task', task.id, 'tab')} 
                className="p-2 border border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer transition-all hover:shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className={cn("flex flex-wrap gap-2 mt-3 text-xs font-semibold transition-opacity text-slate-500", isDone && "opacity-40")}>
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5" /> {formatDateStr(task.date)}
          </span>
          {(task.start_time || task.due_time) && !hideTime && (
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" /> {task.start_time || task.due_time}{task.end_time && ` - ${task.end_time}`}
            </span>
          )}
          <span className={cn(
            "px-2 py-1 rounded-lg capitalize",
            task.priority === 'high' && "bg-red-50 text-red-700",
            task.priority === 'medium' && "bg-orange-50 text-orange-700",
            task.priority === 'low' && "bg-blue-50 text-blue-700"
          )}>
            {task.priority} Priority
          </span>
          <span className="bg-slate-50 px-2 py-1 rounded-lg">
            {task.estimated_duration_minutes}m
          </span>
        </div>
      </div>
    </div>
  );
};
