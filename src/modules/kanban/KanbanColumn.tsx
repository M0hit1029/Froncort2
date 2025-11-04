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
    <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{board.title}</h3>
        <span className="text-sm text-gray-500">{tasks.length}</span>
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
            <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
              <input
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddTask}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Add
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
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
