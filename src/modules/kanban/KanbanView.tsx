'use client';

import { useProjectStore } from '@/store/projectStore';
import KanbanBoard from './KanbanBoard';

export default function KanbanView() {
  const { selectedProjectId } = useProjectStore();
  
  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No project selected</p>
      </div>
    );
  }
  
  return <KanbanBoard projectId={selectedProjectId} />;
}
