"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { useEffect, useRef } from "react";
import { subscribeToProject, emitProjectEvent } from "@/lib/realtime";
import { useProjectStore } from "@/store/projectStore";
import { useUserStore } from "@/store/userStore";
import { canEdit } from "@/lib/permissions";

interface DocumentEditorProps {
  projectId: string;
  docId: string;
  userName?: string;
}

export default function DocumentEditor({
  projectId,
  docId,
  userName = "Anonymous",
}: DocumentEditorProps) {
  const { getUserRoleForProject } = useProjectStore();
  const { currentUser } = useUserStore();

  const userRole = getUserRoleForProject(projectId, currentUser.id);
  const isEditable = canEdit(userRole);

  // Throttle for document update events
  const lastEmitTime = useRef<number>(0);

  // Track the current room name for provider lifecycle
  const currentRoomName = `project-${projectId}-doc-${docId}`;
  const roomNameRef = useRef<string>(currentRoomName);

  // Initialize Y.js document and provider using refs to survive React Strict Mode
  // These are initialized lazily on first access to ensure they're available immediately
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);

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
    providerRef.current = new WebrtcProvider(currentRoomName, yDocRef.current, {
      signaling: ["ws://localhost:4444"],
    });
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
        Array.from(provider.awareness.getStates().values())
      );
    };

    provider.on("status", logStatus);
    provider.on("synced", logSynced);
    provider.awareness.on("change", logPeers);

    return () => {
      provider.off("status", logStatus);
      provider.off("synced", logSynced);
      provider.awareness.off("change", logPeers);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4",
      },
    },
    onUpdate: () => {
      // Optional: Emit document update event for activity logging
      const now = Date.now();
      if (now - lastEmitTime.current > 5000) {
        lastEmitTime.current = now;
        emitProjectEvent(projectId, "document:update", {
          docId,
          userName,
          timestamp: now,
        });
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
        <p className="text-gray-500">Initializing collaboration...</p>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!isEditable && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <strong>Read-only mode:</strong> You have view-only access to this
          document.
        </div>
      )}
      <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={
                !isEditable || !editor.can().chain().focus().toggleBold().run()
              }
              className={`px-3 py-1 rounded ${
                editor.isActive("bold")
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              } border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={
                !isEditable ||
                !editor.can().chain().focus().toggleItalic().run()
              }
              className={`px-3 py-1 rounded ${
                editor.isActive("italic")
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              } border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <em>I</em>
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              disabled={!isEditable}
              className={`px-3 py-1 rounded ${
                editor.isActive("heading", { level: 1 })
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              } border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              H1
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              disabled={!isEditable}
              className={`px-3 py-1 rounded ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              } border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={!isEditable}
              className={`px-3 py-1 rounded ${
                editor.isActive("bulletList")
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              } border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              • List
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={!isEditable}
              className={`px-3 py-1 rounded ${
                editor.isActive("orderedList")
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              } border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              1. List
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {provider?.connected ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Connected ({provider.awareness.getStates().size} online)
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Connecting...
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
