import React from 'react';
import { cn } from '../lib/utils';
import { TaskItem } from './TaskItem';
import { HabitItem } from './HabitItem';

interface ScheduleTimelineItemProps {
  block: any;
  isSelected: boolean;
  isDone: boolean;
  colorConfig: any;
  onToggleSelection: (id: string, date: string) => void;
  onEdit: (type: 'task' | 'habit', data: any, context: 'schedule' | 'tab') => void;
  onDelete: (type: 'task' | 'habit', id: string, context: 'schedule' | 'tab') => void;
}

export const ScheduleTimelineItem: React.FC<ScheduleTimelineItemProps> = ({
  block,
  isSelected,
  isDone,
  colorConfig,
  onToggleSelection,
  onEdit,
  onDelete
}) => {
  const isFreeTime = block.category === 'free_time';

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-8 group relative min-h-[60px]">
      {/* Time Section */}
      <div className="sm:w-12 shrink-0 text-left sm:text-right sm:pt-2 px-1 sm:px-0">
        <span className="text-[10px] sm:text-[11px] font-black sm:font-bold text-slate-400 dark:text-slate-500 tabular-nums tracking-widest sm:tracking-tight uppercase sm:normal-case">
          {block.start_time}
        </span>
      </div>

      {/* Content area with left-side status indicator */}
      <div className="flex-1 pb-6 relative pl-4 sm:pl-6 border-l border-slate-200 dark:border-slate-800 group-last:border-l-transparent ml-1 sm:ml-0">
        {/* Active Item Indicator Line */}
        {!isFreeTime && (
          <div className={cn(
            "absolute left-[-1.5px] top-2 h-12 w-[3px] rounded-full transition-all duration-300",
            block.category === 'task' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : `bg-${colorConfig.name}-500 shadow-[0_0_8px_rgba(var(--${colorConfig.name}-500),0.5)]`,
            isDone && "grayscale opacity-30 shadow-none"
          )} />
        )}

        {isFreeTime ? (
          <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 border-dashed bg-slate-50/50 dark:bg-slate-900/5 text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-100/40">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mb-1 block">Unscheduled</span>
            <p className="text-xs font-semibold text-slate-400/80 dark:text-slate-500">{block.label}</p>
          </div>
        ) : (
          <div className="transition-all hover:translate-x-1 duration-300">
            {block.category === 'task' ? (
              <TaskItem
                task={block.originalData}
                isSelected={isSelected}
                isDone={isDone}
                hideBorder={true}
                hideTime={true}
                strikethrough={true}
                onToggleSelection={onToggleSelection}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : (
              <HabitItem
                habit={block.originalData}
                isSelected={isSelected}
                isDone={isDone}
                hideBorder={true}
                hideTime={true}
                hideFrequency={true}
                strikethrough={true}
                colorConfig={colorConfig}
                onToggleSelection={(id) => onToggleSelection(id, block.effectiveDate)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
