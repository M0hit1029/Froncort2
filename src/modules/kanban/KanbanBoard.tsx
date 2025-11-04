'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useKanbanStore, Task, Board } from '@/store/kanbanStore';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { AddBoardButton } from './AddBoardButton';

interface KanbanBoardProps {
  projectId: string;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { getBoardsByProject, getTasksByBoard, moveTask, addBoard, addTask } = useKanbanStore();
  const { getUserRoleForProject } = useProjectStore();
  const { currentUser } = useUserStore();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const boards = getBoardsByProject(projectId);
  const userRole = getUserRoleForProject(projectId, currentUser.id);
  
  // Determine if user can edit (admin, editor, or owner can edit)
  const canEdit = userRole === 'owner' || userRole === 'admin' || userRole === 'editor';
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    if (!canEdit) return;
    
    const { active } = event;
    const taskId = active.id as string;
    
    // Find the task across all boards
    for (const board of boards) {
      const tasks = getTasksByBoard(board.id);
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };
  
  const handleDragOver = () => {
    if (!canEdit) return;
    // This can be used for visual feedback during drag
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    if (!canEdit) return;
    
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const taskId = active.id as string;
    const overId = over.id as string;
    
    // Check if dropped over a board or a task
    const targetBoard = boards.find((b) => b.id === overId);
    
    if (targetBoard) {
      // Dropped directly on a board (empty space)
      const tasksInBoard = getTasksByBoard(targetBoard.id);
      moveTask(taskId, targetBoard.id, tasksInBoard.length);
    } else {
      // Dropped on another task - find which board it belongs to
      for (const board of boards) {
        const tasks = getTasksByBoard(board.id);
        const targetTaskIndex = tasks.findIndex((t) => t.id === overId);
        
        if (targetTaskIndex !== -1) {
          moveTask(taskId, board.id, targetTaskIndex);
          break;
        }
      }
    }
    
    setActiveTask(null);
  };
  
  const handleAddBoard = (title: string) => {
    if (!canEdit) return;
    
    const newBoard: Board = {
      id: `board-${crypto.randomUUID()}`,
      title,
      projectId,
      position: boards.length,
    };
    
    addBoard(newBoard);
  };
  
  const handleAddTask = (boardId: string, title: string, description?: string) => {
    if (!canEdit) return;
    
    const tasksInBoard = getTasksByBoard(boardId);
    const newTask: Task = {
      id: `task-${crypto.randomUUID()}`,
      title,
      description,
      boardId,
      projectId,
      position: tasksInBoard.length,
    };
    
    addTask(newTask);
  };
  
  if (!userRole) {
    return (
      <div className="p-6">
        <p className="text-red-600">You don&apos;t have access to this project</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kanban Board</h2>
        <div className="text-sm text-gray-600">
          Role: <span className="font-semibold capitalize">{userRole}</span>
          {!canEdit && ' (Read-only)'}
        </div>
      </div>
      
      <DndContext
        sensors={canEdit ? sensors : []}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {boards.map((board) => {
            const tasks = getTasksByBoard(board.id);
            return (
              <KanbanColumn
                key={board.id}
                board={board}
                tasks={tasks}
                canEdit={canEdit}
                onAddTask={handleAddTask}
              />
            );
          })}
          
          {canEdit && <AddBoardButton onAddBoard={handleAddBoard} />}
        </div>
        
        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
