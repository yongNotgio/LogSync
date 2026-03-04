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
    <header className="sticky top-0 z-50 border-b border-sky-100/60 bg-white/80 backdrop-blur-md shadow-sm shadow-sky-100/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-200 group-hover:scale-110 transition-transform duration-200">
              <span className="text-white text-base">📋</span>
            </div>
            <span className="font-extrabold text-xl text-sky-900 tracking-tight">LogSync</span>
            <span className="text-xs bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-700 border border-sky-200/60 px-2 py-0.5 rounded-full font-semibold">
              AI
            </span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { to: "/dashboard", label: "Dashboard" },
                { to: "/journal", label: "Today's Journal" },
                { to: "/history", label: "History" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(to)
                      ? "bg-sky-50 text-sky-700 shadow-sm border border-sky-100"
                      : "text-slate-600 hover:text-sky-700 hover:bg-sky-50/60"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-sky-100" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-slate-500 font-medium">
                {user.username}
              </span>
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-8 w-8 rounded-full ring-2 ring-sky-200 shadow-sm"
                />
              )}
              <button
                onClick={logout}
                className="text-sm text-slate-400 hover:text-sky-600 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-sky-50"
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <NavContent />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-sky-100 bg-white/70 backdrop-blur py-6">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs">📋</span>
            </div>
            <span className="font-semibold text-sky-800">LogSync AI</span>
          </div>
          <p>Automate your internship journal — powered by Gemini AI &amp; GitHub.</p>
        </div>
      </footer>
    </div>
  );
}

