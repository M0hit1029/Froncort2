'use client';

import { useKanbanStore } from '@/store/kanbanStore';
import { useUserStore } from '@/store/userStore';
import { KanbanCard } from './KanbanCard';

interface AssignedTasksViewProps {
  projectId: string;
}

export default function AssignedTasksView({ projectId }: AssignedTasksViewProps) {
  const { tasks } = useKanbanStore();
  const { currentUser, users } = useUserStore();
  
  // Filter tasks assigned to current user in this project
  const assignedTasks = tasks.filter(
    (task) =>
      task.projectId === projectId &&
      task.assignedUsers?.includes(currentUser.id)
  );

  if (assignedTasks.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-[#00ff00] mb-4">My Assigned Tasks</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#00ff00]/70">You have no assigned tasks in this project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#00ff00] mb-6">My Assigned Tasks</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignedTasks.map((task) => {
          // Get board name for context
          const board = useKanbanStore.getState().boards.find((b) => b.id === task.boardId);
          const boardTitle = board?.title || 'Unknown Board';
          
          // Get other assigned users
          const otherAssignedUsers = task.assignedUsers
            ?.filter((userId) => userId !== currentUser.id)
            .map((userId) => users.find((u) => u.id === userId)?.name)
            .filter(Boolean);

          return (
            <div key={task.id} className="relative">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-[#00ff00]/50 font-medium">{boardTitle}</span>
              </div>
              <KanbanCard task={task} isDragging={false} canDrag={false} />
              {otherAssignedUsers && otherAssignedUsers.length > 0 && (
                <div className="mt-2 text-xs text-[#00ff00]/50">
                  Also assigned: {otherAssignedUsers.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
