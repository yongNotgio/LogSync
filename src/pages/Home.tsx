import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GitHubLogin } from "@/components/auth/GitHubLogin";

export function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
          Automate Your
          <span className="text-primary-600"> Internship Journal</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          LogSync AI transforms your GitHub commits into professional daily work journals.
          Map your coding activity to a standard 9-to-5 schedule with AI-powered descriptions.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
              Go to Dashboard
            </Link>
          ) : (
            <GitHubLogin />
          )}
        </div>
      </div>

      {/* Features */}
      <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="text-3xl mb-4">🔗</div>
          <h3 className="font-semibold text-lg mb-2">GitHub Integration</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Automatically pull commits, diffs, and activity from your repositories.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">🤖</div>
          <h3 className="font-semibold text-lg mb-2">AI Enhancement</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Transform casual commit messages into professional, HR-ready descriptions.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">⏰</div>
          <h3 className="font-semibold text-lg mb-2">8-to-5 Schedule</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Map all activities to a standard workday, regardless of actual commit times.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">✏️</div>
          <h3 className="font-semibold text-lg mb-2">Inline Editing</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Fine-tune AI-generated content with an intuitive editing interface.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">💾</div>
          <h3 className="font-semibold text-lg mb-2">Auto-Save</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Never lose your work with real-time persistence powered by Convex.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">🔒</div>
          <h3 className="font-semibold text-lg mb-2">Finalize & Lock</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Lock completed journals to prevent accidental changes.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-24">
        <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold dark:bg-primary-900/30">
              1
            </div>
            <h3 className="font-semibold mb-2">Connect GitHub</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign in with your GitHub account to grant access to your repositories.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold dark:bg-primary-900/30">
              2
            </div>
            <h3 className="font-semibold mb-2">Fetch Commits</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We pull your commits and diffs for the selected date.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold dark:bg-primary-900/30">
              3
            </div>
            <h3 className="font-semibold mb-2">AI Generation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gemini AI creates professional time blocks covering 8AM to 5PM.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold dark:bg-primary-900/30">
              4
            </div>
            <h3 className="font-semibold mb-2">Review & Finalize</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Edit as needed, then finalize your journal for the day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
