import React from 'react';
import { CheckSquare, Trash2, Plus } from 'lucide-react';
import { TaskItem } from '../components/TaskItem';
import { formatDateLabel } from '../lib/dateUtils';

interface TasksViewProps {
  tasks: any[];
  selectedIds: Set<string>;
  toggleSelection: (id: string, date: string) => void;
  handleEditClick: (type: 'task', data: any, context: 'schedule' | 'tab') => void;
  handleDelete: (type: 'task', id: string, context: 'schedule' | 'tab') => void;
  handleDeleteCompletedTasks: () => void;
  handleAddNewItem: (type: 'task') => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  selectedIds,
  toggleSelection,
  handleEditClick,
  handleDelete,
  handleDeleteCompletedTasks,
  handleAddNewItem
}) => {
  const allTasks = [...(tasks || [])].sort((a, b) => a.date.localeCompare(b.date));
  const activeTasks = allTasks.filter(t => !t.completed);
  const completedTasks = allTasks.filter(t => t.completed);

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-6 fade-in">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center">
          <CheckSquare className="w-10 h-10 opacity-20" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 dark:text-slate-100">No tasks yet</p>
          <p className="text-sm font-medium mt-1">Start tracking your activities today</p>
        </div>
        <button 
          onClick={() => handleAddNewItem('task')}
          className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Create first task
        </button>
      </div>
    );
  }

  const renderTaskItem = (task: any) => {
    const isSelected = selectedIds.has(`${task.id}:${task.date}`);
    const isDone = task.completed;
    return (
      <TaskItem
        key={task.id}
        task={task}
        isSelected={isSelected}
        isDone={isDone}
        strikethrough={true}
        onToggleSelection={toggleSelection}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />
    );
  };

  const activeGrouped = activeTasks.reduce((acc, t) => {
    acc[t.date] = acc[t.date] || [];
    acc[t.date].push(t);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 pb-40 fade-in">
      {Object.entries(activeGrouped).map(([date, dateTasks]) => (
        <div key={date} className="space-y-3">
          <h3 className="px-1 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{formatDateLabel(date)}</h3>
          {(dateTasks as any[]).map(renderTaskItem)}
        </div>
      ))}
      
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 pt-4 pb-2">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <button 
              onClick={handleDeleteCompletedTasks}
              className="ml-4 text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          {completedTasks.map(renderTaskItem)}
        </div>
      )}
    </div>
  );
};
