export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#00ff00] mb-4">
          Welcome to Froncort
        </h1>
        <p className="text-lg text-[#00ff00]/80 mb-8">
          Select a project from the sidebar to get started
        </p>
        <div className="bg-black border border-[#00ff00]/30 rounded-lg shadow-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-3 text-[#00ff00]">Features</h2>
          <ul className="text-left space-y-2 text-[#00ff00]/80">
            <li>• Kanban board for task management</li>
            <li>• Document management system</li>
            <li>• Activity feed for project updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
