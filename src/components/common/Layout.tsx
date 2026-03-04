import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GitHubLogin } from "@/components/auth/GitHubLogin";
import logoImg from "@/assets/logo.png";

// SVG Icon components
function IconBook() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const navLinks = [
  { to: "/dashboard", label: "Dashboard", Icon: IconGrid },
  { to: "/journal", label: "Journal", Icon: IconBook },
  { to: "/history", label: "History", Icon: IconClock },
];

function NavContent() {
  const location = useLocation();
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 gap-6">

        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <img src={logoImg} alt="LogSync" className="w-18 h-18 rounded-lg object-contain group-hover:scale-110 transition-transform" />
          <span className="font-extrabold text-lg text-sky-900 tracking-tight">LogSync</span>
          <span className="text-[10px] bg-sky-100 text-sky-700 border border-sky-200/60 px-1.5 py-0.5 rounded-full font-bold leading-none">AI</span>
        </Link>

        {/* Center: Tab strip */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-0.5 bg-slate-100 rounded-xl px-1.5 py-1.5 flex-1 max-w-md mx-auto">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center justify-center px-5 py-1.5 rounded-lg text-sm font-semibold transition-all flex-1 ${
                  isActive(to)
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: User */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {/* Bell */}
              <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
              {/* Divider + avatar + name */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="h-7 w-7 rounded-full ring-2 ring-sky-200" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-semibold text-slate-700">{user.username}</span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <IconLogout />
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
    <div className="min-h-screen flex flex-col bg-white">
      <NavContent />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="LogSync" className="w-5 h-5 rounded-md object-contain" />
            <span className="font-semibold text-slate-600">LogSync AI</span>
          </div>
          <p>Automate your internship journal — powered by Gemini AI &amp; GitHub.</p>
        </div>
      </footer>
    </div>
  );
}

