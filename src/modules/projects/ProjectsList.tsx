import { Project } from '@/store/projectStore';

interface ProjectsListProps {
  projects: Project[];
}

export default function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div key={project.id} className="p-3 bg-white rounded-lg shadow-sm">
          <h3 className="font-semibold">{project.name}</h3>
          <p className="text-sm text-gray-600">{project.description}</p>
        </div>
      ))}
    </div>
  );
}
