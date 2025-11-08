import { create } from 'zustand';

export interface Task {
  id: string;
  title: string;
  description?: string;
  link?: string;
  boardId: string;
  projectId: string;
  position: number;
  assignedUsers?: string[]; // Array of user IDs
  createdBy: string; // User ID of the creator
}

export interface Board {
  id: string;
  title: string;
  projectId: string;
  position: number;
}

interface KanbanStore {
  boards: Board[];
  tasks: Task[];
  addBoard: (board: Board) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newBoardId: string, newPosition: number) => void;
  getBoardsByProject: (projectId: string) => Board[];
  getTasksByBoard: (boardId: string) => Task[];
}

// Mock data
const mockBoards: Board[] = [
  { id: 'board-1', title: 'To Do', projectId: '1', position: 0 },
  { id: 'board-2', title: 'In Progress', projectId: '1', position: 1 },
  { id: 'board-3', title: 'Done', projectId: '1', position: 2 },
  { id: 'board-4', title: 'Backlog', projectId: '2', position: 0 },
  { id: 'board-5', title: 'Testing', projectId: '2', position: 1 },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design homepage',
    description: 'Create wireframes and mockups',
    boardId: 'board-1',
    projectId: '1',
    position: 0,
    createdBy: 'userA',
  },
  {
    id: 'task-2',
    title: 'Setup database',
    description: 'Configure PostgreSQL',
    boardId: 'board-1',
    projectId: '1',
    position: 1,
    createdBy: 'userA',
  },
  {
    id: 'task-3',
    title: 'Implement authentication',
    description: 'Add user login and signup',
    boardId: 'board-2',
    projectId: '1',
    position: 0,
    createdBy: 'userB',
  },
  {
    id: 'task-4',
    title: 'Write API documentation',
    description: 'Document all endpoints',
    boardId: 'board-3',
    projectId: '1',
    position: 0,
    createdBy: 'userC',
  },
  {
    id: 'task-5',
    title: 'Research tech stack',
    description: 'Evaluate options',
    boardId: 'board-4',
    projectId: '2',
    position: 0,
    createdBy: 'userA',
  },
];

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  boards: mockBoards,
  tasks: mockTasks,
  
  addBoard: (board: Board) =>
    set((state) => ({
      boards: [...state.boards, board],
    })),
  
  addTask: (task: Task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  
  updateTask: (taskId: string, updates: Partial<Task>) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    })),
  
  deleteTask: (taskId: string) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;
      
      const updatedTasks = state.tasks
        .filter((t) => t.id !== taskId)
        .map((t) => {
          // Adjust positions of tasks in the same board
          if (t.boardId === task.boardId && t.position > task.position) {
            return { ...t, position: t.position - 1 };
          }
          return t;
        });
      
      return { tasks: updatedTasks };
    }),
  
  moveTask: (taskId: string, newBoardId: string, newPosition: number) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;
      
      const oldBoardId = task.boardId;
      const oldPosition = task.position;
      
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, boardId: newBoardId, position: newPosition };
        }
        // Update positions in the source board (close the gap)
        if (t.boardId === oldBoardId && t.position > oldPosition) {
          return { ...t, position: t.position - 1 };
        }
        // Update positions of other tasks in the target board
        if (t.boardId === newBoardId && t.position >= newPosition) {
          return { ...t, position: t.position + 1 };
        }
        return t;
      });
      
      return { tasks: updatedTasks };
    }),
  
  getBoardsByProject: (projectId: string) => {
    const state = get();
    return state.boards
      .filter((board) => board.projectId === projectId)
      .sort((a, b) => a.position - b.position);
  },
  
  getTasksByBoard: (boardId: string) => {
    const state = get();
    return state.tasks
      .filter((task) => task.boardId === boardId)
      .sort((a, b) => a.position - b.position);
  },
}));
