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
import { useNotificationStore } from '@/store/notificationStore';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { AddBoardButton } from './AddBoardButton';
import { TaskDetailsModal } from './TaskDetailsModal';
import { subscribeToProject, emitProjectEvent } from '@/lib/realtime';
import { canEdit } from '@/lib/permissions';

interface KanbanBoardProps {
  projectId: string;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { getBoardsByProject, getTasksByBoard, moveTask, addBoard, addTask, updateTask, deleteTask } = useKanbanStore();
  const { getUserRoleForProject } = useProjectStore();
  const { currentUser, users } = useUserStore();
  const { addNotification } = useNotificationStore();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
      } else if (event.eventType === 'kanban:card:update') {
        const { taskId, updates } = event.payload;
        if (typeof taskId === 'string' && updates) {
          updateTask(taskId, updates);
        }
      } else if (event.eventType === 'kanban:card:delete') {
        const { taskId } = event.payload;
        if (typeof taskId === 'string') {
          deleteTask(taskId);
        }
      } else if (event.eventType === 'kanban:board:add') {
        const board = event.payload as unknown as Board;
        addBoard(board);
      } else if (event.eventType === 'notification:task:assigned') {
        // Handle task assignment notification from other tabs
        const notification = event.payload;
        if (notification && typeof notification === 'object') {
          addNotification(notification);
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [projectId, moveTask, addTask, addBoard, updateTask, deleteTask, addNotification]);
  
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
    
    // Find the task being moved
    const task = activeTask;
    if (!task) {
      setActiveTask(null);
      return;
    }
    
    const fromBoard = boards.find((b) => b.id === task.boardId);
    
    // Check if dropped over a board or a task
    const targetBoard = boards.find((b) => b.id === overId);
    
    let targetBoardId: string | undefined;
    let targetPosition: number | undefined;
    let toBoard: Board | undefined;
    
    if (targetBoard) {
      // Dropped directly on a board (empty space)
      const tasksInBoard = getTasksByBoard(targetBoard.id);
      targetBoardId = targetBoard.id;
      targetPosition = tasksInBoard.length;
      toBoard = targetBoard;
      moveTask(taskId, targetBoardId, targetPosition);
    } else {
      // Dropped on another task - find which board it belongs to
      for (const board of boards) {
        const tasks = getTasksByBoard(board.id);
        const targetTaskIndex = tasks.findIndex((t) => t.id === overId);
        
        if (targetTaskIndex !== -1) {
          targetBoardId = board.id;
          targetPosition = targetTaskIndex;
          toBoard = board;
          moveTask(taskId, targetBoardId, targetPosition);
          break;
        }
      }
    }
    
    // Emit realtime event for card move with complete information
    if (targetBoardId && targetPosition !== undefined && toBoard && fromBoard) {
      emitProjectEvent(projectId, 'kanban:card:move', {
        taskId,
        taskTitle: task.title,
        boardId: targetBoardId,
        position: targetPosition,
        fromBoardId: fromBoard.id,
        toBoardId: toBoard.id,
      }, currentUser.id);
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
    emitProjectEvent(projectId, 'kanban:board:add', newBoard, currentUser.id);
  };
  
  const handleAddTask = (boardId: string, title: string, description?: string, link?: string, assignedUsers?: string[]) => {
    if (!canEditKanban) return;
    
    const tasksInBoard = getTasksByBoard(boardId);
    const newTask: Task = {
      id: `task-${crypto.randomUUID()}`,
      title,
      description,
      link,
      boardId,
      projectId,
      position: tasksInBoard.length,
      assignedUsers: assignedUsers || [],
      createdBy: currentUser.id,
    };
    
    addTask(newTask);
    
    // Emit realtime event for card add
    emitProjectEvent(projectId, 'kanban:card:add', newTask, currentUser.id);
    
    // Send notifications to assigned users
    if (assignedUsers && assignedUsers.length > 0) {
      const assignerName = currentUser.name;
      assignedUsers.forEach((userId) => {
        // Don't notify the person who created the task
        if (userId !== currentUser.id) {
          const assignedUser = users.find((u) => u.id === userId);
          if (assignedUser) {
            const notification = {
              userId,
              type: 'task_assignment' as const,
              message: `${assignerName} assigned you to task: "${title}"`,
              taskId: newTask.id,
              taskTitle: title,
              projectId,
            };
            
            // Add notification locally
            addNotification(notification);
            
            // Emit notification event for other tabs/users
            emitProjectEvent(projectId, 'notification:task:assigned', notification, currentUser.id);
          }
        }
      });
    }
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    if (!canEditKanban) return;
    
    updateTask(taskId, updates);
    
    // Emit realtime event for task update
    emitProjectEvent(projectId, 'kanban:card:update', { taskId, updates }, currentUser.id);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!canEditKanban) return;
    
    deleteTask(taskId);
    
    // Emit realtime event for task delete
    emitProjectEvent(projectId, 'kanban:card:delete', { taskId }, currentUser.id);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
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
                onTaskClick={handleTaskClick}
              />
            );
          })}
          
          {canEditKanban && <AddBoardButton onAddBoard={handleAddBoard} />}
        </div>
        
        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
      
      {selectedTask && (
        <TaskDetailsModal
          key={selectedTask.id}
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          canEdit={canEditKanban}
        />
      )}
    </div>
  );
}
