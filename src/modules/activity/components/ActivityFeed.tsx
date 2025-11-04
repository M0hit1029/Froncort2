'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivityStore, ActivityEvent } from '@/store/activityStore';
import { subscribeToProject, RealtimeEvent } from '@/lib/realtime';
import { useUserStore } from '@/store/userStore';
import { useProjectStore } from '@/store/projectStore';
import { useDocumentStore } from '@/store/documentStore';
import { useKanbanStore } from '@/store/kanbanStore';

interface ActivityFeedProps {
  projectId: string;
}

export default function ActivityFeed({ projectId }: ActivityFeedProps) {
  const { activities, addActivity } = useActivityStore();
  const users = useUserStore((state) => state.users);
  const projects = useProjectStore((state) => state.projects);
  const documents = useDocumentStore((state) => state.documents);
  const { tasks, boards } = useKanbanStore();
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Filter activities for this project
  const projectActivities = activities.filter(
    (activity) => activity.data.projectId === projectId
  );

  // Update current time every minute for relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    const user = users.find((u) => u.id === event.userId);
    const userName = user?.name || 'Unknown User';

    switch (event.eventType) {
      case 'document:update': {
        const doc = documents.find((d) => d.id === event.payload.documentId);
        addActivity({
          type: 'document_edit',
          userId: event.userId || 'unknown',
          userName,
          data: {
            projectId,
            documentId: event.payload.documentId,
            documentTitle: doc?.title || event.payload.documentTitle || 'Unknown Document',
          },
        });
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

  // Subscribe to realtime events
  useEffect(() => {
    const unsubscribe = subscribeToProject(projectId, handleRealtimeEvent);
    return unsubscribe;
  }, [projectId, handleRealtimeEvent]);

  const formatActivityMessage = (activity: ActivityEvent): string => {
    switch (activity.type) {
      case 'project_share':
        return `${activity.userName} shared project with ${activity.data.targetUserName}`;
      case 'document_edit':
        return `${activity.userName} edited Document ${activity.data.documentTitle}`;
      case 'task_move':
        return `${activity.userName} moved task '${activity.data.taskTitle}' to '${activity.data.toBoard}'`;
      default:
        return 'Unknown activity';
    }
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    const baseClasses = "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold";
    
    switch (type) {
      case 'project_share':
        return <div className={`${baseClasses} bg-purple-500`}>👥</div>;
      case 'document_edit':
        return <div className={`${baseClasses} bg-green-500`}>📝</div>;
      case 'task_move':
        return <div className={`${baseClasses} bg-blue-500`}>✓</div>;
      default:
        return <div className={`${baseClasses} bg-gray-500`}>•</div>;
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const diff = currentTime - timestamp;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return new Date(timestamp).toLocaleString();
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Activity Feed</h2>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {projectActivities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No recent activity. Start collaborating on your project!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence initial={false}>
              {projectActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                  }}
                  className="overflow-hidden"
                >
                  <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formatActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
