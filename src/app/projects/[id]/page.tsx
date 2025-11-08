'use client';

import { useState, use, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ProjectHeader } from '@/components/ProjectHeader';
import KanbanView from '@/modules/kanban/KanbanView';
import DocumentsView from '@/modules/documents/DocumentsView';
import ActivityFeedView from '@/modules/activity/ActivityFeedView';
import AssignedTasksView from '@/modules/kanban/AssignedTasksView';
import GlobalActivityTracker from '@/components/GlobalActivityTracker';

type Tab = 'kanban' | 'documents' | 'activity' | 'assigned';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState<Tab>('kanban');
  const { projects, setSelectedProject } = useProjectStore();
  
  const project = projects.find(p => p.id === resolvedParams.id);
  
  // Set the selected project when the component mounts or project ID changes
  useEffect(() => {
    setSelectedProject(resolvedParams.id);
  }, [resolvedParams.id, setSelectedProject]);

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Project not found</h1>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'kanban', label: 'Kanban' },
    { id: 'assigned', label: 'Assigned Tasks' },
    { id: 'documents', label: 'Documents' },
    { id: 'activity', label: 'Activity Feed' },
  ];

  return (
    <div className="flex-1">
      {/* Global Activity Tracker - always mounted to track activities regardless of active tab */}
      <GlobalActivityTracker projectId={project.id} />
      
      <ProjectHeader 
        projectId={project.id}
        projectName={project.name}
        projectDescription={project.description}
      />
      <div className="bg-black border-b border-[#00ff00]/20">
        <div className="flex gap-4 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#00ff00] text-[#00ff00]'
                  : 'border-transparent text-[#00ff00]/60 hover:text-[#00ff00]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-black min-h-screen">
        {activeTab === 'kanban' && <KanbanView />}
        {activeTab === 'assigned' && <AssignedTasksView projectId={project.id} />}
        {activeTab === 'documents' && <DocumentsView />}
        {activeTab === 'activity' && <ActivityFeedView projectId={project.id} />}
      </div>
    </div>
  );
}
