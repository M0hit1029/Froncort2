'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { subscribeToProject, RealtimeEvent } from '@/lib/realtime';
import { useUserStore } from '@/store/userStore';
import { useProjectStore } from '@/store/projectStore';
import { useDocumentStore } from '@/store/documentStore';
import { useKanbanStore } from '@/store/kanbanStore';

interface GlobalActivityTrackerProps {
  projectId: string;
}

/**
 * Global activity tracker that monitors all project activities
 * regardless of which tab is currently active.
 * This component should be mounted at the project level to ensure
 * continuous activity tracking.
 */
export default function GlobalActivityTracker({ projectId }: GlobalActivityTrackerProps) {
  const { addActivity } = useActivityStore();
  const users = useUserStore((state) => state.users);
  const projects = useProjectStore((state) => state.projects);
  const documents = useDocumentStore((state) => state.documents);
  const { tasks, boards } = useKanbanStore();
  
  // Track last activity time per document to prevent duplicate activities
  const lastDocumentActivityRef = useRef<Map<string, number>>(new Map());
  const DOCUMENT_ACTIVITY_DEBOUNCE = 10000; // 10 seconds debounce for document edits

  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    const user = users.find((u) => u.id === event.userId);
    const userName = user?.name || 'Unknown User';

    switch (event.eventType) {
      case 'document:update': {
        const documentId = event.payload.documentId;
        const now = Date.now();
        const lastActivity = lastDocumentActivityRef.current.get(documentId) || 0;
        
        // Only track document edit if it's been more than DOCUMENT_ACTIVITY_DEBOUNCE since last activity
        // This prevents tracking every keystroke
        if (now - lastActivity > DOCUMENT_ACTIVITY_DEBOUNCE) {
          const doc = documents.find((d) => d.id === documentId);
          addActivity({
            type: 'document_edit',
            userId: event.userId || 'unknown',
            userName,
            data: {
              projectId,
              documentId,
              documentTitle: doc?.title || event.payload.documentTitle || 'Unknown Document',
            },
          });
          lastDocumentActivityRef.current.set(documentId, now);
        }
        break;
      }

      case 'kanban:card:move': {
        const task = tasks.find((t) => t.id === event.payload.taskId);
        const fromBoard = boards.find((b) => b.id === event.payload.fromBoardId);
        const toBoard = boards.find((b) => b.id === event.payload.toBoardId);
        
        addActivity({
          type: 'task_move',
          userId: event.userId || 'unknown',
          userName,
          data: {
            projectId,
            taskTitle: task?.title || event.payload.taskTitle || 'Unknown Task',
            fromBoard: fromBoard?.title || 'Unknown',
            toBoard: toBoard?.title || 'Unknown',
          },
        });
        break;
      }

      case 'activity:log': {
        if (event.payload.activityType === 'project_share') {
          const targetUser = users.find((u) => u.id === event.payload.targetUserId);
          const project = projects.find((p) => p.id === projectId);
          
          addActivity({
            type: 'project_share',
            userId: event.userId || 'unknown',
            userName,
            data: {
              projectId,
              projectName: project?.name || 'Unknown Project',
              targetUserId: event.payload.targetUserId,
              targetUserName: targetUser?.name || 'Unknown User',
            },
          });
        }
        break;
      }
    }
  }, [users, documents, tasks, boards, projects, projectId, addActivity]);

  // Subscribe to realtime events - this runs regardless of which tab is active
  useEffect(() => {
    const unsubscribe = subscribeToProject(projectId, handleRealtimeEvent);
    return unsubscribe;
  }, [projectId, handleRealtimeEvent]);

  // This component doesn't render anything - it just tracks activities
  return null;
}
