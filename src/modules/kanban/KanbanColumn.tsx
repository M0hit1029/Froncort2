'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Board, Task } from '@/store/kanbanStore';
import { KanbanCard } from './KanbanCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  board: Board;
  tasks: Task[];
  canEdit: boolean;
  onAddTask: (boardId: string, title: string, description?: string) => void;
}

export function KanbanColumn({ board, tasks, canEdit, onAddTask }: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  
  const { setNodeRef } = useDroppable({
    id: board.id,
  });
  
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(board.id, newTaskTitle.trim(), newTaskDescription.trim() || undefined);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setIsAddingTask(false);
    }
  };
  
  const handleCancel = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsAddingTask(false);
  };
  
  return (
    <div className="flex-shrink-0 w-80 bg-black border border-[#00ff00]/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-[#00ff00]">{board.title}</h3>
        <span className="text-sm text-[#00ff00]/70">{tasks.length}</span>
      </div>
      
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} isDragging={false} canDrag={canEdit} />
          ))}
        </div>
      </SortableContext>
      
      {canEdit && (
        <div className="mt-4">
          {isAddingTask ? (
            <div className="bg-black border border-[#00ff00]/30 rounded-lg p-3 space-y-2">
              <input
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-2 py-1 bg-black border border-[#00ff00]/30 text-[#00ff00] rounded focus:outline-none focus:ring-2 focus:ring-[#00ff00] placeholder-[#00ff00]/50"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask();
                  } else if (e.key === 'Escape') {
                    handleCancel();
                  }
                }}
              />
              <textarea
                placeholder="Description (optional)"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full px-2 py-1 bg-black border border-[#00ff00]/30 text-[#00ff00] rounded focus:outline-none focus:ring-2 focus:ring-[#00ff00] text-sm placeholder-[#00ff00]/50"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddTask}
                  className="px-3 py-1 bg-[#004000] text-[#00ff00] border border-[#00ff00]/50 rounded hover:bg-[#006000] text-sm"
                >
                  Add
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-black text-[#00ff00]/70 border border-[#00ff00]/30 rounded hover:bg-[#002000] text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[#00ff00]/70 hover:bg-[#002000] border border-[#00ff00]/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add task</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
