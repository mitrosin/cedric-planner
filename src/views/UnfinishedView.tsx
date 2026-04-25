import React from 'react';
import { CheckSquare } from 'lucide-react';
import { TaskItem } from '../components/TaskItem';
import { HabitItem } from '../components/HabitItem';
import { HABIT_COLORS } from '../constants';
import { formatDateLabel } from '../lib/dateUtils';

interface UnfinishedViewProps {
  unfinished: any[];
  selectedIds: Set<string>;
  toggleSelection: (id: string, date?: string) => void;
  handleEditClick: (type: 'task' | 'habit', data: any, context: 'schedule' | 'tab') => void;
  handleDelete: (type: 'task' | 'habit', id: string, context: 'schedule' | 'tab') => void;
}

export const UnfinishedView: React.FC<UnfinishedViewProps> = ({
  unfinished,
  selectedIds,
  toggleSelection,
  handleEditClick,
  handleDelete
}) => {
  if (!unfinished || unfinished.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
        <CheckSquare className="w-12 h-12 opacity-20" />
        <p className="font-medium">No unfinished items. Great job!</p>
      </div>
    );
  }

  const grouped = unfinished.reduce((acc, item) => {
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 pb-40 fade-in">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <h3 className="px-1 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{formatDateLabel(date)}</h3>
          {(items as any[]).map((item) => {
            if (item.type === 'task') {
              const isSelected = selectedIds.has(`${item.id}:${item.date}`);
              return (
                <TaskItem
                  key={item.id}
                  task={item}
                  isSelected={isSelected}
                  isDone={false}
                  isUnfinishedView={true}
                  onToggleSelection={toggleSelection}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                />
              );
            } else {
              const isSelected = selectedIds.has(`${item.id.split(':')[0]}:${item.date}`);
              const colorConfig = HABIT_COLORS.find(c => c.name === item.color) || HABIT_COLORS[0];
              return (
                <HabitItem
                  key={item.id}
                  habit={item}
                  isSelected={isSelected}
                  isDone={false}
                  colorConfig={colorConfig}
                  hideFrequency={true}
                  onToggleSelection={(id) => toggleSelection(id, item.date)}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                />
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};
