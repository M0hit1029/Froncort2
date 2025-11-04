"use client"

import { ProjectShareModal } from "./ProjectShareModal"

interface ProjectHeaderProps {
  projectId: string
  projectName: string
  projectDescription: string
}

export function ProjectHeader({ projectId, projectName, projectDescription }: ProjectHeaderProps) {
  return (
    <div className="bg-white border-b">
      <div className="px-6 py-4 flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
          <p className="text-gray-600 mt-1">{projectDescription}</p>
        </div>
        <div className="ml-4">
          <ProjectShareModal projectId={projectId} />
        </div>
      </div>
    </div>
  )
}
