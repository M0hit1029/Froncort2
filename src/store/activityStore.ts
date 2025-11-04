import { create } from 'zustand';

export interface ActivityEvent {
  id: string;
  type: 'project_share' | 'document_edit' | 'task_move';
  timestamp: number;
  userId: string;
  userName: string;
  data: {
    projectId?: string;
    projectName?: string;
    targetUserId?: string;
    targetUserName?: string;
    documentId?: string;
    documentTitle?: string;
    taskTitle?: string;
    fromBoard?: string;
    toBoard?: string;
  };
}

interface ActivityStore {
  activities: ActivityEvent[];
  addActivity: (activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  getActivitiesByProject: (projectId: string) => ActivityEvent[];
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  
  addActivity: (activity) => {
    const newActivity: ActivityEvent = {
      ...activity,
      id: `activity-${crypto.randomUUID()}`,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      activities: [newActivity, ...state.activities].slice(0, 100), // Keep last 100 activities
    }));
  },
  
  getActivitiesByProject: (projectId: string) => {
    const state = get();
    return state.activities.filter(
      (activity) => activity.data.projectId === projectId
    );
  },
  
  clearActivities: () => {
    set({ activities: [] });
  },
}));
