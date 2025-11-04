export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Froncort
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Select a project from the sidebar to get started
        </p>
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-3">Features</h2>
          <ul className="text-left space-y-2 text-gray-700">
            <li>• Kanban board for task management</li>
            <li>• Document management system</li>
            <li>• Activity feed for project updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
