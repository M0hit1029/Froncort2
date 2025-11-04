import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface SharedProject {
  projectId: string;
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  sharedAt: Date;
}

interface ProjectStore {
  projects: Project[];
  sharedProjects: SharedProject[];
  selectedProjectId: string | null;
  setSelectedProject: (id: string) => void;
  addShare: (projectId: string, userId: string, role: 'viewer' | 'editor' | 'admin') => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [
    { id: '1', name: 'Project Alpha', description: 'First project' },
    { id: '2', name: 'Project Beta', description: 'Second project' },
    { id: '3', name: 'Project Gamma', description: 'Third project' },
  ],
  sharedProjects: [],
  selectedProjectId: null,
  setSelectedProject: (id: string) => set({ selectedProjectId: id }),
  addShare: (projectId: string, userId: string, role: 'viewer' | 'editor' | 'admin') =>
    set((state) => ({
      sharedProjects: [
        ...state.sharedProjects,
        {
          projectId,
          userId,
          role,
          sharedAt: new Date(),
        },
      ],
    })),
}));
