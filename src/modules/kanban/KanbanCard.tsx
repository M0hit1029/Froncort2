'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/store/kanbanStore';

interface KanbanCardProps {
  task: Task;
  isDragging: boolean;
  canDrag?: boolean;
}

export function KanbanCard({ task, isDragging, canDrag = true }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: !canDrag });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${isDragging ? 'shadow-lg' : 'hover:shadow-md'} transition-shadow`}
    >
      <h4 className="font-medium text-sm mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
      )}
    </div>
  );
}
