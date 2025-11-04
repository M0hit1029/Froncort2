'use client';

import Link from 'next/link';
import { useProjectStore } from '@/store/projectStore';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { projects } = useProjectStore();
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-8">Froncort</h1>
      
      <nav>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">PROJECTS</h2>
        <ul className="space-y-2">
          {projects.map((project) => (
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
