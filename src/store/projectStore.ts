import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description: string;
}

interface ProjectStore {
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [
    { id: '1', name: 'Project Alpha', description: 'First project' },
    { id: '2', name: 'Project Beta', description: 'Second project' },
    { id: '3', name: 'Project Gamma', description: 'Third project' },
  ],
  selectedProjectId: null,
  setSelectedProject: (id: string) => set({ selectedProjectId: id }),
}));
