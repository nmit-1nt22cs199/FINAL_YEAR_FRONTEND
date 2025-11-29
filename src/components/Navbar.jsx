import { LogOut } from 'lucide-react';

export default function Navbar({ currentPage, setPage, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '' },
    { id: 'register', label: 'Register', icon: '' },
    { id: 'track', label: 'Live Tracking', icon: '' },
    { id: 'alerts', label: 'Alerts', icon: '' },
    { id: 'history', label: 'History', icon: '' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Gradient backdrop blur */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950/80 backdrop-blur-md"></div>

      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

      {/* Navigation Content */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-slate-950 group-hover:shadow-lg group-hover:shadow-cyan-400/50 transition-all duration-300">
            FM
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg leading-none">Fleet Monitor</span>
            <span className="text-cyan-400 text-xs">Real-time Tracking</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900/40 border border-cyan-500/20 rounded-full px-2 py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 text-sm whitespace-nowrap ${currentPage === item.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 border border-red-500/30 rounded-full text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 text-sm font-medium group"
            title="Logout"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-cyan-500/20 px-6 py-3 flex gap-2 overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm whitespace-nowrap ${currentPage === item.id
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
              : 'bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Mobile Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-all duration-300 text-sm font-medium whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
    </nav>
  );
}
