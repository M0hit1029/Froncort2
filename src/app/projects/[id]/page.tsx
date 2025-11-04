'use client';

import { useState, use } from 'react';
import { useProjectStore } from '@/store/projectStore';
import KanbanView from '@/modules/kanban/KanbanView';
import DocumentsView from '@/modules/documents/DocumentsView';
import ActivityFeedView from '@/modules/activity/ActivityFeedView';

type Tab = 'kanban' | 'documents' | 'activity';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState<Tab>('kanban');
  const { projects } = useProjectStore();
  
  const project = projects.find(p => p.id === resolvedParams.id);

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Project not found</h1>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'kanban', label: 'Kanban' },
    { id: 'documents', label: 'Documents' },
    { id: 'activity', label: 'Activity Feed' },
  ];

  return (
    <div className="flex-1">
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>
        <div className="flex gap-4 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        {activeTab === 'kanban' && <KanbanView />}
        {activeTab === 'documents' && <DocumentsView />}
        {activeTab === 'activity' && <ActivityFeedView />}
      </div>
    </div>
  );
}
