'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
// import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { useEffect, useRef, useMemo } from 'react';
import { subscribeToProject, emitProjectEvent } from '@/lib/realtime';

interface DocumentEditorProps {
  projectId: string;
  docId: string;
  userName?: string;
}

export default function DocumentEditor({ projectId, docId, userName = 'Anonymous' }: DocumentEditorProps) {
  // Refs to store Y.js doc and provider to prevent recreation
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  
  // Throttle for document update events
  const lastEmitTime = useRef<number>(0);

  // Initialize Y.js document and provider only once using useMemo
  const yDoc = useMemo(() => {
    if (!yDocRef.current) {
      yDocRef.current = new Y.Doc();
    }
    return yDocRef.current;
  }, []);

  const roomName = `project-${projectId}-doc-${docId}`;
  const provider = useMemo(() => {
    if (!providerRef.current) {
      providerRef.current = new WebrtcProvider(roomName, yDoc);
    }
    return providerRef.current;
  }, [roomName, yDoc]);

  // Optional realtime event bridge for document updates
  useEffect(() => {
    // Subscribe to document update events (optional bridge)
    const unsubscribe = subscribeToProject(projectId, (event) => {
      if (event.eventType === 'document:update' && event.payload.docId === docId) {
        // Document update event received from realtime
        // Y.js already handles the actual collaboration through WebRTC
        // This is just an optional bridge for logging/notifications
        console.log('Document update event:', event);
      }
    });
    
    return unsubscribe;
  }, [projectId, docId]);

  // Cleanup on unmount
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

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: yDoc,
      }),
      // Note: CollaborationCursor v3.0.0 has compatibility issues with the current setup
      // The basic collaboration still works via Yjs and WebRTC
      // TODO: Investigate proper v3 CollaborationCursor configuration
      // CollaborationCursor.configure({
      //   provider: provider,
      //   user: {
      //     name: userName,
      //     color: userColor,
      //   },
      // }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: () => {
      // Optional: Emit document update event for activity logging
      // Throttled to avoid excessive events (max once every 5 seconds)
      const now = Date.now();
      if (now - lastEmitTime.current > 5000) {
        lastEmitTime.current = now;
        emitProjectEvent(projectId, 'document:update', {
          docId,
          userName,
          timestamp: now,
        });
      }
    },
  }, [yDoc, provider, userName, projectId, docId]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('bold') ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'
              } border border-gray-300 disabled:opacity-50`}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('italic') ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'
              } border border-gray-300 disabled:opacity-50`}
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('heading', { level: 1 }) ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'
              } border border-gray-300`}
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'
              } border border-gray-300`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('bulletList') ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'
              } border border-gray-300`}
            >
              • List
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1 rounded ${
                editor.isActive('orderedList') ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'
              } border border-gray-300`}
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
