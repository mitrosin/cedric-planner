import React from 'react';
import { Repeat, Plus } from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableHabitItem } from '../components/SortableHabitItem';
import { HABIT_COLORS } from '../constants';

interface HabitsViewProps {
  habits: any[];
  selectedIds: Set<string>;
  userSettings: any;
  handleHabitDragEnd: (event: DragEndEvent) => void;
  toggleSelection: (id: string, date?: string) => void;
  handleEditClick: (type: 'habit', data: any, context: 'tab') => void;
  handleDelete: (type: 'habit', id: string, context: 'tab') => void;
  handleAddNewItem: (type: 'habit') => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  selectedIds,
  userSettings,
  handleHabitDragEnd,
  toggleSelection,
  handleEditClick,
  handleDelete,
  handleAddNewItem
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!habits || habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-6 fade-in">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center">
          <Repeat className="w-10 h-10 opacity-20" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 dark:text-slate-100">No habits yet</p>
          <p className="text-sm font-medium mt-1">Start building good routines today</p>
        </div>
        <button 
          onClick={() => handleAddNewItem('habit')}
          className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Create first habit
        </button>
      </div>
    );
  }

  const sortedHabits = [...(habits || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-3 pb-40 fade-in">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleHabitDragEnd}
      >
        <SortableContext 
          items={sortedHabits.map(h => h.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedHabits.map((habit) => {
            const isSelected = selectedIds.has(habit.id);
            const habitColorName = habit.color || userSettings.defaultHabitColor || 'emerald';
            const colorConfig = HABIT_COLORS.find(c => c.name === habitColorName) || HABIT_COLORS[0];
            
            return (
              <SortableHabitItem
                key={habit.id}
                id={habit.id}
                habit={habit}
                isSelected={isSelected}
                isDone={false}
                colorConfig={colorConfig}
                onToggleSelection={toggleSelection}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
};
