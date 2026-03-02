import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GitHubLogin } from "@/components/auth/GitHubLogin";

function NavContent() {
  const location = useLocation();
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">📋</span>
            <span className="text-primary-600">LogSync</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full dark:bg-primary-900/30 dark:text-primary-400">
              AI
            </span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-primary-600"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/journal"
                className={`text-sm font-medium transition-colors ${
                  isActive("/journal")
                    ? "text-primary-600"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
              >
                Today's Journal
              </Link>
              <Link
                to="/history"
                className={`text-sm font-medium transition-colors ${
                  isActive("/history")
                    ? "text-primary-600"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
              >
                History
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                {user.username}
              </span>
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-8 w-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                />
              )}
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <GitHubLogin />
          )}
        </div>
      </div>
    </header>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavContent />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          LogSync AI - Automate your internship journal
        </div>
      </footer>
    </div>
  );
}
