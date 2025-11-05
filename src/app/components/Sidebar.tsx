'use client';

import Link from 'next/link';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';

export default function Sidebar() {
  const { getVisibleProjects } = useProjectStore();
  const { currentUser, users, setCurrentUser } = useUserStore();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const visibleProjects = getVisibleProjects(currentUser.id);

  const handleUserChange = (userId: string) => {
    setCurrentUser(userId);
    setDropdownOpen(false);
  };

  return (
    <aside className="w-64 bg-black text-[#00ff00] min-h-screen p-6 flex flex-col border-r border-[#00ff00]/20">
      <h1 className="text-2xl font-bold mb-8 text-[#00ff00]">Froncort</h1>
      
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
        <h2 className="text-sm font-semibold text-[#00ff00]/70 mb-3">PROJECTS</h2>
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
    </aside>
  );
}
