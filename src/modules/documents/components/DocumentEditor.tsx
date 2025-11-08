/* eslint-disable react-hooks/refs */
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { useEffect, useRef, useState, useCallback } from "react";
import { subscribeToProject, emitProjectEvent } from "@/lib/realtime";
import { useProjectStore } from "@/store/projectStore";
import { useUserStore } from "@/store/userStore";
import { canEdit } from "@/lib/permissions";
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useVersionStore } from "@/store/versionStore";
import VersionHistoryModal from "@/components/VersionHistoryModal";
import { Save, History, Clock } from "lucide-react";

const stringColor = () => {
  // Simple function to generate a color from a string
  const colors = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

interface DocumentEditorProps {
  projectId: string;
  docId: string;
  userName?: string;
  documentTitle?: string;
}

const AUTO_SAVE_INTERVAL = 120000; // 2 minutes in milliseconds

export default function DocumentEditor({
  projectId,
  docId,
  userName = "Anonymous",
  documentTitle = "Untitled Document",
}: DocumentEditorProps) {
  const { getUserRoleForProject } = useProjectStore();
  const { currentUser } = useUserStore();
  const { addVersion, getDocumentVersions, deleteVersion } = useVersionStore();

  const userRole = getUserRoleForProject(projectId, currentUser.id);
  const isEditable = canEdit(userRole);

  // State for version history modal
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState(() => Date.now());
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time every second for UI display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Throttle for document update events
  const lastEmitTime = useRef<number>(0);

  // Track the current room name for provider lifecycle
  const currentRoomName = `project-${projectId}-doc-${docId}`;
  const roomNameRef = useRef<string>(currentRoomName);



  // Initialize Y.js document and provider using refs to survive React Strict Mode
  // These are initialized lazily on first access to ensure they're available immediately
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);

  const saveVersion = useCallback((isAutoSave: boolean = false) => {
    if (!yDocRef.current) return;

    // Check if there are active collaborators (excluding self)
    const activeUsers = providerRef.current?.awareness?.getStates().size || 0;
    
    // In collaborative mode with auto-save, check if other users are actively editing
    if (isAutoSave && activeUsers > 1) {
      // Check if document has been recently modified by others
      const states = Array.from(providerRef.current?.awareness?.getStates().values() || []);
      const recentActivity = states.some((state: Record<string, unknown>) => {
        const lastActivity = (state.lastActivity as number) || 0;
        return Date.now() - lastActivity < 10000; // 10 seconds
      });
      
      // Skip auto-save if there's recent activity from others to avoid conflicts
      if (recentActivity) {
        console.log("Skipping auto-save due to active collaboration");
        return;
      }
    }

    try {
      // Encode the current state as an update
      const encoded = Y.encodeStateAsUpdate(yDocRef.current);
      const now = Date.now();
      
      addVersion({
        documentId: docId,
        projectId,
        title: `${documentTitle} - ${new Date(now).toLocaleString()}`,
        timestamp: now,
        content: encoded,
        createdBy: userName,
        isAutoSaved: isAutoSave,
      });

      if (isAutoSave) {
        setLastAutoSaveTime(now);
      }

      console.log(`Version saved (${isAutoSave ? 'auto' : 'manual'})`);
    } catch (error) {
      console.error("Error saving version:", error);
    }
  }, [docId, projectId, documentTitle, userName, addVersion]);

  const restoreVersion = useCallback((versionId: string) => {
    if (!yDocRef.current) return;

    const versions = getDocumentVersions(docId);
    const version = versions.find(v => v.id === versionId);

    if (!version) {
      console.error("Version not found");
      return;
    }

    try {
      // Clear the current document
      yDocRef.current.transact(() => {
        // Get the shared type and clear it
        const xmlFragment = yDocRef.current!.getXmlFragment('content');
        xmlFragment.delete(0, xmlFragment.length);
      });

      // Apply the version update
      Y.applyUpdate(yDocRef.current, version.content);

      console.log("Version restored successfully");
      setIsVersionModalOpen(false);
    } catch (error) {
      console.error("Error restoring version:", error);
    }
  }, [docId, getDocumentVersions]);

// Lazy initialization of yDoc
if (!yDocRef.current) {
  yDocRef.current = new Y.Doc();
}

// Lazy initialization or recreation of provider when room changes
if (!providerRef.current || roomNameRef.current !== currentRoomName) {
  // Clean up old provider if it exists (room name changed)
  if (providerRef.current) {
    providerRef.current.destroy();
  }

  roomNameRef.current = currentRoomName;
  providerRef.current = new HocuspocusProvider({
    url: 'ws://127.0.0.1:1234',
    name: currentRoomName,
    document: yDocRef.current!,
  })

  console.log(providerRef.current);
}

const yDoc = yDocRef.current;
const provider = providerRef.current;

useEffect(() => {
  if (!provider) return;

  const logStatus = (status: { connected: boolean }) => {
    console.log("WebRTC provider status:", status);
  };
  const logSynced = (event: { synced: boolean }) => {
    console.log("Synced with peers:", event.synced);
  };

  const logPeers = () => {
    console.log(
      "Awareness states:",
      Array.from(provider.awareness?.getStates().values() || [])
    );
  };

  provider.on("status", logStatus);
  provider.on("synced", logSynced);
  provider.awareness?.on("change", logPeers);

  return () => {
    provider.off("status", logStatus);
    provider.off("synced", logSynced);
    provider.awareness?.off("change", logPeers);
  };
}, [provider]);

// Optional realtime event bridge for document updates
useEffect(() => {
  // Subscribe to document update events (optional bridge)
  const unsubscribe = subscribeToProject(projectId, (event) => {
    if (
      event.eventType === "document:update" &&
      event.payload.docId === docId
    ) {
      // Document update event received from realtime
      // Y.js already handles the actual collaboration through WebRTC
      // This is just an optional bridge for logging/notifications
      console.log("Document update event:", event);
    }
  });

  return unsubscribe;
}, [projectId, docId]);

// Auto-save functionality
useEffect(() => {
  if (!isEditable) return; // Don't auto-save if user doesn't have edit permissions

  const autoSaveInterval = setInterval(() => {
    saveVersion(true); // Auto-save
  }, AUTO_SAVE_INTERVAL);

  return () => clearInterval(autoSaveInterval);
}, [isEditable, projectId, docId, documentTitle, userName]); // eslint-disable-line react-hooks/exhaustive-deps

// Cleanup on unmount only
useEffect(() => {
  return () => {
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (yDocRef.current) {
      yDocRef.current.destroy();
      yDocRef.current = null;
    }
  };
}, []);



const editor = useEditor(
  {
    immediatelyRender: false,
    editable: isEditable,
    extensions: [
      StarterKit.configure({
        undoRedo: false, // disable normal undo/redo (conflicts with collaboration)
      }),
      Collaboration.configure({
        document: yDoc,
        field: 'content',
      }),
      // CollaborationCursor removed due to initialization timing issues
      // The cursor plugin tries to access Collaboration's ystate before it's fully initialized
      // Collaboration still works without showing other users' cursors
      CollaborationCaret.configure({
        provider: providerRef.current,
        user: {
          name: userName,
          color: stringColor(),
        }
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4",
      },
    },
    onUpdate: () => {
      // Optional: Emit document update event for activity logging
      const now = Date.now();
      if (now - lastEmitTime.current > 5000) {
        lastEmitTime.current = now;
        emitProjectEvent(projectId, "document:update", {
          documentId: docId,
          documentTitle,
          userName,
          timestamp: now,
        }, currentUser.id);
      }
    },
  },
  [yDoc, provider, userName, projectId, docId, isEditable]
);

// Update editor editability dynamically without recreating the editor
useEffect(() => {
  if (editor && editor.isEditable !== isEditable) {
    editor.setEditable(isEditable);
  }
}, [editor, isEditable]);

// Wait until provider is initialized properly
if (!provider) {
  console.log("Waiting for provider to be ready...");
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-[#00ff00]">Initializing collaboration...</p>
    </div>
  );
}

if (!editor) {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-[#00ff00]">Loading editor...</p>
    </div>
  );
}

return (
  <div className="w-full">
    {!isEditable && (
      <div className="mb-4 p-3 bg-[#403000] border border-[#ffff00]/30 rounded-lg text-[#ffff00] text-sm">
        <strong>Read-only mode:</strong> You have view-only access to this
        document.
      </div>
    )}
    <div className="mb-4 p-2 bg-black rounded-lg border border-[#00ff00]/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={
              !isEditable || !editor.can().chain().focus().toggleBold().run()
            }
            className={`px-3 py-1 rounded ${editor.isActive("bold")
                ? "bg-[#004000] text-[#00ff00]"
                : "bg-black text-[#00ff00] hover:bg-[#002000]"
              } border border-[#00ff00]/30 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={
              !isEditable ||
              !editor.can().chain().focus().toggleItalic().run()
            }
            className={`px-3 py-1 rounded ${editor.isActive("italic")
                ? "bg-[#004000] text-[#00ff00]"
                : "bg-black text-[#00ff00] hover:bg-[#002000]"
              } border border-[#00ff00]/30 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <em>I</em>
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            disabled={!isEditable}
            className={`px-3 py-1 rounded ${editor.isActive("heading", { level: 1 })
                ? "bg-[#004000] text-[#00ff00]"
                : "bg-black text-[#00ff00] hover:bg-[#002000]"
              } border border-[#00ff00]/30 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            H1
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            disabled={!isEditable}
            className={`px-3 py-1 rounded ${editor.isActive("heading", { level: 2 })
                ? "bg-[#004000] text-[#00ff00]"
                : "bg-black text-[#00ff00] hover:bg-[#002000]"
              } border border-[#00ff00]/30 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={!isEditable}
            className={`px-3 py-1 rounded ${editor.isActive("bulletList")
                ? "bg-[#004000] text-[#00ff00]"
                : "bg-black text-[#00ff00] hover:bg-[#002000]"
              } border border-[#00ff00]/30 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={!isEditable}
            className={`px-3 py-1 rounded ${editor.isActive("orderedList")
                ? "bg-[#004000] text-[#00ff00]"
                : "bg-black text-[#00ff00] hover:bg-[#002000]"
              } border border-[#00ff00]/30 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            1. List
          </button>
          <div className="w-px h-6 bg-[#00ff00]/20 mx-1"></div>
          <button
            onClick={() => saveVersion(false)}
            disabled={!isEditable}
            className="flex items-center gap-1 px-3 py-1 rounded bg-[#004000] text-[#00ff00] hover:bg-[#006000] border border-[#00ff00]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save current version"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save Version</span>
          </button>
          <button
            onClick={() => setIsVersionModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1 rounded bg-black text-[#00ff00] hover:bg-[#002000] border border-[#00ff00]/30"
            title="View version history"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-[#00ff00]/50 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Auto-save: {Math.floor((currentTime - lastAutoSaveTime) / 1000)}s ago</span>
          </div>
          <div className="text-sm text-[#00ff00]/70">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-[#00ff00] rounded-full"></span>
              Collaborative ({provider?.awareness?.getStates().size || 0} online)
            </span>
          </div>
        </div>
      </div>
    </div>
    <div className="border border-[#00ff00]/20 rounded-lg bg-black min-h-[300px]">
      <EditorContent editor={editor} />
    </div>

    <VersionHistoryModal
      isOpen={isVersionModalOpen}
      onClose={() => setIsVersionModalOpen(false)}
      versions={getDocumentVersions(docId)}
      onRestore={(version) => restoreVersion(version.id)}
      onDelete={(versionId) => deleteVersion(versionId)}
    />
  </div>
);
}
