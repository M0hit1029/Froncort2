'use client';

import Link from 'next/link';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, User, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Sidebar() {
  const { getVisibleProjects, addProject } = useProjectStore();
  const { currentUser, users, setCurrentUser } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const visibleProjects = getVisibleProjects(currentUser.id);

  const handleUserChange = (userId: string) => {
    setCurrentUser(userId);
    setDropdownOpen(false);
  };

  const handleCreateProject = () => {
    if (projectName.trim()) {
      const newProject = addProject(projectName, projectDescription, currentUser.id);
      setProjectName('');
      setProjectDescription('');
      setDialogOpen(false);
      // Navigate to the new project
      router.push(`/projects/${newProject.id}`);
    }
  };

  return (
    <aside className="w-64 bg-black text-[#00ff00] min-h-screen p-6 flex flex-col border-r border-[#00ff00]/20 shrink-0">
      <h1 className="text-2xl font-bold mb-8 text-[#00ff00] flex justify-center items-center">{'<'}Co-Verse{'/>'}</h1>
      
      {/* User Dropdown */}
      <div className="mb-6 relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-black border border-[#00ff00]/30 rounded-lg hover:bg-[#004000] transition-colors"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">{currentUser.name}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-[#00ff00]/30 rounded-lg shadow-lg z-10 overflow-hidden">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserChange(user.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[#004000] transition-colors ${
                  currentUser.id === user.id ? 'bg-[#004000] font-medium' : ''
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <nav className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#00ff00]/70">PROJECTS</h2>
          <button
            onClick={() => setDialogOpen(true)}
            className="p-1 rounded hover:bg-[#004000] transition-colors"
            title="New Project"
          >
            <Plus className="w-4 h-4 text-[#00ff00]" />
          </button>
        </div>
        <ul className="space-y-2">
          {visibleProjects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  pathname.includes(`/projects/${project.id}`)
                    ? 'bg-[#004000] text-[#00ff00] border border-[#00ff00]/30'
                    : 'text-[#00ff00]/80 hover:bg-[#004000] hover:text-[#00ff00]'
                }`}
              >
                {project.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* New Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project. You will be the owner and have full admin rights.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-[#00ff00]">
                Project Name
              </Label>
              <Input
                id="projectName"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && projectName.trim()) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription" className="text-[#00ff00]">
                Description
              </Label>
              <Input
                id="projectDescription"
                placeholder="Enter project description (optional)"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setProjectName('');
                setProjectDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
