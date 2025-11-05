'use client';

import { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';
import DocumentEditor from './components/DocumentEditor';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DocumentsView() {
  const { selectedProjectId } = useProjectStore();
  const { documents, addDocument, getProjectDocuments, deleteDocument } = useDocumentStore();
  const { currentUser } = useUserStore();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <p className="text-[#00ff00]">Please select a project first</p>
      </div>
    );
  }

  const projectDocs = getProjectDocuments(selectedProjectId);
  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const handleCreateDocument = () => {
    if (newDocTitle.trim()) {
      const newDoc = addDocument(selectedProjectId, newDocTitle.trim());
      setSelectedDocId(newDoc.id);
      setNewDocTitle('');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteDocument = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(docId);
      if (selectedDocId === docId) {
        setSelectedDocId(null);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)]">
      {/* Document List Sidebar */}
      <div className="w-80 bg-black border-r border-[#00ff00]/20 overflow-y-auto">
        <div className="p-4 border-b border-[#00ff00]/20">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Document title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateDocument();
                    }
                  }}
                />
                <Button onClick={handleCreateDocument} className="w-full">
                  Create Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="p-2">
          {projectDocs.length === 0 ? (
            <div className="text-center py-8 text-[#00ff00]/70">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents yet</p>
              <p className="text-xs">Create one to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projectDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDocId === doc.id
                      ? 'bg-[#004000] border border-[#00ff00]/50'
                      : 'hover:bg-[#002000] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-[#00ff00] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-[#00ff00]">{doc.title}</p>
                      <p className="text-xs text-[#00ff00]/70">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#400000] rounded transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-[#ff0000]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedDoc ? (
          <div className="p-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold mb-2 text-[#00ff00]">{selectedDoc.title}</h1>
              <p className="text-sm text-[#00ff00]/70">
                Last updated: {new Date(selectedDoc.updatedAt).toLocaleString()}
              </p>
            </div>
            <DocumentEditor
              projectId={selectedProjectId}
              docId={selectedDoc.id}
              userName={currentUser.name}
              documentTitle={selectedDoc.title}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#00ff00]/70">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No document selected</p>
              <p className="text-sm">Select a document from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
