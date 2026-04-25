import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { HabitItem } from './HabitItem';
import { cn } from '../lib/utils';

interface SortableHabitItemProps {
  id: string;
  habit: any;
  isSelected: boolean;
  isDone?: boolean;
  colorConfig: any;
  strikethrough?: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: (type: 'task' | 'habit', data: any, context: 'schedule' | 'tab') => void;
  onDelete: (type: 'task' | 'habit', id: string, context: 'schedule' | 'tab') => void;
}

export const SortableHabitItem: React.FC<SortableHabitItemProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "relative group flex items-center gap-2",
        isDragging && "z-50 opacity-50"
      )}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <HabitItem {...props} hideBorder={false} />
      </div>
    </div>
  );
};
