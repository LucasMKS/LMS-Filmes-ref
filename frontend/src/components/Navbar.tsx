import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Film, 
  Tv, 
  Users, 
  Bookmark, 
  Heart, 
  Star, 
  ListFilter, 
  BarChart2, 
  Search, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User as UserIcon 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSSE } from '../hooks/useSSE';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'movie' | 'serie'>('movie');

  // Conecta ao SSE para notificações em tempo real
  useSSE();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchType === 'movie') {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/series?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Filmes', href: '/', icon: Film },
    { name: 'Séries', href: '/series', icon: Tv },
    { name: 'Atores', href: '/atores', icon: Users },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark, auth: true },
    { name: 'Favoritos', href: '/favoritos', icon: Heart, auth: true },
    { name: 'Avaliados', href: '/avaliados', icon: Star, auth: true },
    { name: 'Listas', href: '/listas', icon: ListFilter, auth: true },
    { name: 'Estatísticas', href: '/estatisticas', icon: BarChart2, auth: true },
  ];

  const isActive = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/filmes')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-amber-400 transition-colors">
                LMS<span className="text-amber-500">Filmes</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                if (link.auth && !isAuthenticated) return null;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-zinc-800 text-amber-400 font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Search Bar & User */}
          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-64 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-20 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center bg-zinc-800 rounded px-1 text-[11px] font-semibold text-zinc-400">
                  <button
                    type="button"
                    onClick={() => setSearchType(searchType === 'movie' ? 'serie' : 'movie')}
                    className="hover:text-amber-400 transition-colors uppercase tracking-wider px-1 py-0.5"
                    title="Alternar entre Filmes e Séries"
                  >
                    {searchType === 'movie' ? 'Filmes' : 'Séries'}
                  </button>
                </div>
              </div>
            </form>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-medium text-zinc-300 max-w-[100px] truncate">
                    {user?.name || user?.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="px-4 py-1.5 text-sm font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 pt-2 pb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder={`Buscar ${searchType === 'movie' ? 'filmes' : 'séries'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => setSearchType(searchType === 'movie' ? 'serie' : 'movie')}
              className="px-3 py-2 bg-zinc-800 text-xs font-bold rounded-lg text-amber-400"
            >
              {searchType === 'movie' ? 'FILMES' : 'SÉRIES'}
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              if (link.auth && !isAuthenticated) return null;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    active ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-300">{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-medium text-zinc-300 bg-zinc-900 rounded-lg"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold text-zinc-950 bg-amber-400 rounded-lg"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
