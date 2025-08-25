import useHome from './useHome';

export default function Home() {
  useHome();

  return (
    <div className="flex h-full">
      <div className="flex-1 bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col h-full">
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Welcome to Polygent
                </h1>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Your AI agent orchestration platform is ready. Start by
                  creating a workspace, agent or a new development session.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
