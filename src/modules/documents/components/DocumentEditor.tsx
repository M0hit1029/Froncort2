'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { useEffect, useMemo } from 'react';

interface DocumentEditorProps {
  projectId: string;
  docId: string;
  userName?: string;
}

export default function DocumentEditor({ projectId, docId, userName = 'Anonymous' }: DocumentEditorProps) {
  // Create Y.js document
  const yDoc = useMemo(() => new Y.Doc(), []);

  // Generate a consistent color for the user
  const userColor = useMemo(() => getRandomColor(), []);

  // Create WebRTC provider with room name
  const roomName = `project-${projectId}-doc-${docId}`;
  const provider = useMemo(() => new WebrtcProvider(roomName, yDoc), [roomName, yDoc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      provider.destroy();
      yDoc.destroy();
    };
  }, [provider, yDoc]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: yDoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: userName,
          color: userColor,
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
  }, [yDoc, provider, userName, userColor]);

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

// Helper function to generate random colors for user cursors
function getRandomColor() {
  const colors = [
    '#958DF1',
    '#F98181',
    '#FBBC88',
    '#FAF594',
    '#70CFF8',
    '#94FADB',
    '#B9F18D',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
