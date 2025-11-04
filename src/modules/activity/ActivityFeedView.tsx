'use client';

import ActivityFeed from './components/ActivityFeed';
import ActivityTrigger from './components/ActivityTrigger';

interface ActivityFeedViewProps {
  projectId: string;
}

export default function ActivityFeedView({ projectId }: ActivityFeedViewProps) {
  return (
    <div className="p-6">
      <ActivityTrigger projectId={projectId} />
      <ActivityFeed projectId={projectId} />
    </div>
  );
}
