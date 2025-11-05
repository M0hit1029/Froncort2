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
      className={`bg-black rounded-lg p-3 border border-[#00ff00]/40 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${isDragging ? 'shadow-lg shadow-[#00ff00]/20' : 'hover:border-[#00ff00]/60 hover:shadow-md hover:shadow-[#00ff00]/10'} transition-all`}
    >
      <h4 className="font-medium text-sm mb-1 text-[#00ff00]">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-[#00ff00]/70 line-clamp-2">{task.description}</p>
      )}
    </div>
  );
}
