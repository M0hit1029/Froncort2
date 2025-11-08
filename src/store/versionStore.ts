import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DocumentVersion {
  id: string;
  documentId: string;
  projectId: string;
  title: string;
  timestamp: number;
  content: Uint8Array; // Y.js encoded state
  createdBy?: string;
  isAutoSaved: boolean;
}

interface VersionStore {
  versions: DocumentVersion[];
  addVersion: (version: Omit<DocumentVersion, 'id'>) => DocumentVersion;
  getDocumentVersions: (documentId: string) => DocumentVersion[];
  deleteVersion: (id: string) => void;
  clearDocumentVersions: (documentId: string) => void;
}

export const useVersionStore = create<VersionStore>()(
  persist(
    (set, get) => ({
      versions: [],
      
      addVersion: (version) => {
        const newVersion: DocumentVersion = {
          ...version,
          id: `version-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        };
        set((state) => ({
          versions: [...state.versions, newVersion],
        }));
        return newVersion;
      },
      
      getDocumentVersions: (documentId: string) => {
        return get()
          .versions
          .filter((v) => v.documentId === documentId)
          .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
      },
      
      deleteVersion: (id: string) => {
        set((state) => ({
          versions: state.versions.filter((v) => v.id !== id),
        }));
      },
      
      clearDocumentVersions: (documentId: string) => {
        set((state) => ({
          versions: state.versions.filter((v) => v.documentId !== documentId),
        }));
      },
    }),
    {
      name: 'version-storage',
      // Custom serialization for Uint8Array
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          // Convert array back to Uint8Array
          if (data.state?.versions) {
            data.state.versions = data.state.versions.map((v: { content?: number[] }) => ({
              ...v,
              content: v.content ? new Uint8Array(v.content) : new Uint8Array(),
            }));
          }
          return data;
        },
        setItem: (name, value) => {
          const data = {
            ...value,
            state: {
              ...value.state,
              // Convert Uint8Array to regular array for storage
              versions: value.state.versions.map((v: DocumentVersion) => ({
                ...v,
                content: v.content ? Array.from(v.content) : [],
              })),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
