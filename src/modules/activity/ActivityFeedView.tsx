'use client';

import ActivityFeed from './components/ActivityFeed';

interface ActivityFeedViewProps {
  projectId: string;
}

export default function ActivityFeedView({ projectId }: ActivityFeedViewProps) {
  return (
    <div className="p-6">
      <ActivityFeed projectId={projectId} />
    </div>
  );
}
