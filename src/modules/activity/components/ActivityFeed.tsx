'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivityStore, ActivityEvent } from '@/store/activityStore';

interface ActivityFeedProps {
  projectId: string;
}

export default function ActivityFeed({ projectId }: ActivityFeedProps) {
  const { activities } = useActivityStore();
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
    const baseClasses = "w-10 h-10 rounded-full flex items-center justify-center font-semibold border";
    
    switch (type) {
      case 'project_share':
        return <div className={`${baseClasses} bg-[#003000] border-[#00ff00]/50 text-[#00ff00]`}>👥</div>;
      case 'document_edit':
        return <div className={`${baseClasses} bg-[#004000] border-[#00ff00]/50 text-[#00ff00]`}>📝</div>;
      case 'task_move':
        return <div className={`${baseClasses} bg-[#002000] border-[#00ff00]/50 text-[#00ff00]`}>✓</div>;
      default:
        return <div className={`${baseClasses} bg-black border-[#00ff00]/30 text-[#00ff00]`}>•</div>;
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
      <h2 className="text-2xl font-bold mb-4 text-[#00ff00]">Activity Feed</h2>
      <div className="bg-black rounded-lg border border-[#00ff00]/30 shadow-sm">
        {projectActivities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#00ff00]/70">No recent activity. Start collaborating on your project!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#00ff00]/10">
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
                  <div className="p-4 hover:bg-[#002000] transition-colors cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#00ff00]">
                          {formatActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-[#00ff00]/70 mt-1">
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
