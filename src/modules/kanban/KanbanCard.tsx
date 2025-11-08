'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/store/kanbanStore';
import { useUserStore } from '@/store/userStore';

interface KanbanCardProps {
  task: Task;
  isDragging: boolean;
  canDrag?: boolean;
  onClick?: () => void;
}

export function KanbanCard({ task, isDragging, canDrag = true, onClick }: KanbanCardProps) {
  const { users } = useUserStore();
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

  const assignedUserNames = task.assignedUsers
    ?.map((userId) => users.find((u) => u.id === userId)?.name)
    .filter(Boolean);
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      onClick={() => {
        // Only trigger onClick if not dragging and callback exists
        if (!isSortableDragging && onClick) {
          onClick();
        }
      }}
      className={`bg-black rounded-lg p-3 border border-[#00ff00]/40 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : onClick ? 'cursor-pointer' : 'cursor-default'
      } ${isDragging ? 'shadow-lg shadow-[#00ff00]/20' : 'hover:border-[#00ff00]/60 hover:shadow-md hover:shadow-[#00ff00]/10'} transition-all`}
    >
      <h4 className="font-medium text-sm mb-1 text-[#00ff00]">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-[#00ff00]/70 line-clamp-2 mb-2">{task.description}</p>
      )}
      {assignedUserNames && assignedUserNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {assignedUserNames.map((name, index) => (
            <span
              key={index}
              className="text-xs px-2 py-0.5 bg-[#004000] border border-[#00ff00]/30 rounded text-[#00ff00]/80"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
