import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Document {
  id: string;
  projectId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface DocumentStore {
  documents: Document[];
  addDocument: (projectId: string, title: string) => Document;
  getProjectDocuments: (projectId: string) => Document[];
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: [],
      
      addDocument: (projectId: string, title: string) => {
        const newDoc: Document = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          projectId,
          title,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          documents: [...state.documents, newDoc],
        }));
        return newDoc;
      },
      
      getProjectDocuments: (projectId: string) => {
        return get().documents.filter((doc) => doc.projectId === projectId);
      },
      
      updateDocument: (id: string, updates: Partial<Document>) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id
              ? { ...doc, ...updates, updatedAt: Date.now() }
              : doc
          ),
        }));
      },
      
      deleteDocument: (id: string) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        }));
      },
    }),
    {
      name: 'document-storage',
    }
  )
);
