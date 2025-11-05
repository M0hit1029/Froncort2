"use client"

import { ProjectShareModal } from "./ProjectShareModal"
import { useProjectStore } from "@/store/projectStore"
import { useUserStore } from "@/store/userStore"
import { canShareProject } from "@/lib/permissions"

interface ProjectHeaderProps {
  projectId: string
  projectName: string
  projectDescription: string
}

export function ProjectHeader({ projectId, projectName, projectDescription }: ProjectHeaderProps) {
  const { currentUser } = useUserStore()
  const { getUserRoleForProject } = useProjectStore()
  
  const userRole = getUserRoleForProject(projectId, currentUser.id)
  const canShare = canShareProject(userRole)
  
  const getRoleBadgeStyle = (role: string | null) => {
    switch (role) {
      case 'owner':
        return 'bg-[#004000] text-[#00ff00] border-[#00ff00]/50'
      case 'admin':
        return 'bg-[#003000] text-[#00ff00] border-[#00ff00]/40'
      case 'editor':
        return 'bg-[#002000] text-[#00ff00] border-[#00ff00]/30'
      case 'viewer':
        return 'bg-black text-[#00ff00]/70 border-[#00ff00]/20'
      default:
        return 'bg-black text-[#00ff00]/70 border-[#00ff00]/20'
    }
  }
  
  const getRoleLabel = (role: string | null) => {
    if (!role) return 'No Access'
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <div className="bg-black border-b border-[#00ff00]/20">
      <div className="px-6 py-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[#00ff00]">{projectName}</h1>
            {userRole && (
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeStyle(userRole)}`}>
                Role: {getRoleLabel(userRole)}
              </span>
            )}
          </div>
          <p className="text-[#00ff00]/70 mt-1">{projectDescription}</p>
        </div>
        {canShare && (
          <div className="ml-4">
            <ProjectShareModal projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  )
}
