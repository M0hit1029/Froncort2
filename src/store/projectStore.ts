import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
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
  getVisibleProjects: (userId: string) => Project[];
  getUserRoleForProject: (projectId: string, userId: string) => 'owner' | 'viewer' | 'editor' | 'admin' | null;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [
    { id: '1', name: 'Project Alpha', description: 'First project', ownerId: 'userA' },
    { id: '2', name: 'Project Beta', description: 'Second project', ownerId: 'userA' },
    { id: '3', name: 'Project Gamma', description: 'Third project', ownerId: 'userB' },
  ],
  sharedProjects: [
    // Pre-populate some shares for testing
    { projectId: '1', userId: 'userB', role: 'editor', sharedAt: new Date() },
    { projectId: '2', userId: 'userC', role: 'viewer', sharedAt: new Date() },
    { projectId: '3', userId: 'userA', role: 'admin', sharedAt: new Date() },
  ],
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
  getVisibleProjects: (userId: string) => {
    const state = get();
    // Get projects owned by user
    const ownedProjects = state.projects.filter((p) => p.ownerId === userId);
    // Get projects shared with user
    const sharedProjectIds = state.sharedProjects
      .filter((sp) => sp.userId === userId)
      .map((sp) => sp.projectId);
    const sharedProjects = state.projects.filter((p) => sharedProjectIds.includes(p.id));
    
    // Combine and remove duplicates using Set
    const projectIdSet = new Set(ownedProjects.map((p) => p.id));
    const allProjects = [...ownedProjects];
    sharedProjects.forEach((sp) => {
      if (!projectIdSet.has(sp.id)) {
        allProjects.push(sp);
        projectIdSet.add(sp.id);
      }
    });
    
    return allProjects;
  },
  getUserRoleForProject: (projectId: string, userId: string) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    
    if (!project) return null;
    
    // Check if user is owner
    if (project.ownerId === userId) {
      return 'owner';
    }
    
    // Check if project is shared with user
    const share = state.sharedProjects.find(
      (sp) => sp.projectId === projectId && sp.userId === userId
    );
    
    return share ? share.role : null;
  },
}));
