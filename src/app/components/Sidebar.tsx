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
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-8">Froncort</h1>
      
      {/* User Dropdown */}
      <div className="mb-6 relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">{currentUser.name}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserChange(user.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 transition-colors ${
                  currentUser.id === user.id ? 'bg-gray-600 font-medium' : ''
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <nav className="flex-1">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">PROJECTS</h2>
        <ul className="space-y-2">
          {visibleProjects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  pathname.includes(`/projects/${project.id}`)
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
