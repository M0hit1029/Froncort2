'use client';

import { useState, useEffect } from 'react';
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
import { subscribeToProject, emitProjectEvent } from '@/lib/realtime';
import { canEdit } from '@/lib/permissions';

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
  
  // Determine if user can edit using centralized permission function
  const canEditKanban = canEdit(userRole);
  
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
  
  // Subscribe to realtime events for this project
  useEffect(() => {
    const unsubscribe = subscribeToProject(projectId, (event) => {
      // Handle incoming realtime events from other tabs/users
      if (event.eventType === 'kanban:card:move') {
        const { taskId, boardId, position } = event.payload;
        // Apply the move from another tab/user
        if (typeof taskId === 'string' && typeof boardId === 'string' && typeof position === 'number') {
          moveTask(taskId, boardId, position);
        }
      } else if (event.eventType === 'kanban:card:add') {
        const task = event.payload as unknown as Task;
        addTask(task);
      } else if (event.eventType === 'kanban:board:add') {
        const board = event.payload as unknown as Board;
        addBoard(board);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [projectId, moveTask, addTask, addBoard]);
  
  const handleDragStart = (event: DragStartEvent) => {
    if (!canEditKanban) return;
    
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
    if (!canEditKanban) return;
    // This can be used for visual feedback during drag
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    if (!canEditKanban) return;
    
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const taskId = active.id as string;
    const overId = over.id as string;
    
    // Check if dropped over a board or a task
    const targetBoard = boards.find((b) => b.id === overId);
    
    let targetBoardId: string | undefined;
    let targetPosition: number | undefined;
    
    if (targetBoard) {
      // Dropped directly on a board (empty space)
      const tasksInBoard = getTasksByBoard(targetBoard.id);
      targetBoardId = targetBoard.id;
      targetPosition = tasksInBoard.length;
      moveTask(taskId, targetBoardId, targetPosition);
    } else {
      // Dropped on another task - find which board it belongs to
      for (const board of boards) {
        const tasks = getTasksByBoard(board.id);
        const targetTaskIndex = tasks.findIndex((t) => t.id === overId);
        
        if (targetTaskIndex !== -1) {
          targetBoardId = board.id;
          targetPosition = targetTaskIndex;
          moveTask(taskId, targetBoardId, targetPosition);
          break;
        }
      }
    }
    
    // Emit realtime event for card move
    if (targetBoardId && targetPosition !== undefined) {
      emitProjectEvent(projectId, 'kanban:card:move', {
        taskId,
        boardId: targetBoardId,
        position: targetPosition,
      });
    }
    
    setActiveTask(null);
  };
  
  const handleAddBoard = (title: string) => {
    if (!canEditKanban) return;
    
    const newBoard: Board = {
      id: `board-${crypto.randomUUID()}`,
      title,
      projectId,
      position: boards.length,
    };
    
    addBoard(newBoard);
    
    // Emit realtime event for board add
    emitProjectEvent(projectId, 'kanban:board:add', newBoard);
  };
  
  const handleAddTask = (boardId: string, title: string, description?: string) => {
    if (!canEditKanban) return;
    
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
    
    // Emit realtime event for card add
    emitProjectEvent(projectId, 'kanban:card:add', newTask);
  };
  
  if (!userRole) {
    return (
      <div className="p-6">
        <p className="text-[#00ff00]">You don&apos;t have access to this project</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#00ff00]">Kanban Board</h2>
        <div className="text-sm text-[#00ff00]/70">
          Role: <span className="font-semibold capitalize">{userRole}</span>
          {!canEditKanban && ' (Read-only)'}
        </div>
      </div>
      
      <DndContext
        sensors={canEditKanban ? sensors : []}
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
                canEdit={canEditKanban}
                onAddTask={handleAddTask}
              />
            );
          })}
          
          {canEditKanban && <AddBoardButton onAddBoard={handleAddBoard} />}
        </div>
        
        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
