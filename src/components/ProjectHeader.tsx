"use client"

import { ProjectShareModal } from "./ProjectShareModal"
import { useProjectStore } from "@/store/projectStore"
import { useUserStore } from "@/store/userStore"

interface ProjectHeaderProps {
  projectId: string
  projectName: string
  projectDescription: string
}

export function ProjectHeader({ projectId, projectName, projectDescription }: ProjectHeaderProps) {
  const { currentUser } = useUserStore()
  const { getUserRoleForProject } = useProjectStore()
  
  const userRole = getUserRoleForProject(projectId, currentUser.id)
  
  const getRoleBadgeStyle = (role: string | null) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'editor':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  const getRoleLabel = (role: string | null) => {
    if (!role) return 'No Access'
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <div className="bg-white border-b">
      <div className="px-6 py-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
            {userRole && (
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeStyle(userRole)}`}>
                Role: {getRoleLabel(userRole)}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">{projectDescription}</p>
        </div>
        <div className="ml-4">
          <ProjectShareModal projectId={projectId} />
        </div>
      </div>
    </div>
  )
}
