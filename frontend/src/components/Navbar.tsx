import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Film, 
  Tv, 
  Users, 
  Bookmark, 
  Heart, 
  Star, 
  ListFilter, 
  Search, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User as UserIcon,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSSE } from '../hooks/useSSE';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'movie' | 'serie'>('movie');
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fecha o menu ao mudar de rota
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Trava scroll de fundo quando o menu mobile estiver aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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

  // Navbar principal: Apenas Filmes, Séries, Favoritos e Avaliados
  const navLinks = [
    { name: 'Filmes', href: '/', icon: Film },
    { name: 'Séries', href: '/series', icon: Tv },
    { name: 'Favoritos', href: '/favoritos', icon: Heart, auth: true },
    { name: 'Avaliados', href: '/avaliados', icon: Star, auth: true },
  ];

  // Itens do menu do usuário
  const userMenuLinks = [
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark, description: 'Títulos para assistir' },
    { name: 'Minhas Listas', href: '/listas', icon: ListFilter, description: 'Coleções personalizadas' },
    { name: 'Atores', href: '/atores', icon: Users, description: 'Catálogo de atores' },
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
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-indigo-500/30 transition-all duration-200">
                <Film className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white transition-colors flex items-center gap-1 leading-none">
                  LMS<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 font-semibold">Filmes</span>
                </span>
                <span className="text-[9px] tracking-wider uppercase text-zinc-500 font-medium leading-none mt-1">Cinema & Séries</span>
              </div>
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
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-zinc-400'}`} />
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
                  className="w-48 lg:w-64 bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-20 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center bg-zinc-800/90 rounded-lg px-1.5 text-[11px] font-semibold text-zinc-400">
                  <button
                    type="button"
                    onClick={() => setSearchType(searchType === 'movie' ? 'serie' : 'movie')}
                    className="hover:text-indigo-300 transition-colors uppercase tracking-wider px-1 py-0.5"
                    title="Alternar entre Filmes e Séries"
                  >
                    {searchType === 'movie' ? 'Filmes' : 'Séries'}
                  </button>
                </div>
              </div>
            </form>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* User Menu Dropdown Trigger */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 rounded-xl transition-all duration-200 cursor-pointer shadow-sm group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                      {user?.name?.[0]?.toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 max-w-[120px] truncate">
                      {user?.name || user?.email}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180 text-indigo-400' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#0e121e] border border-zinc-800/90 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Info Header */}
                      <div className="p-3 pb-2.5 border-b border-zinc-800/80 mb-1">
                        <p className="text-xs font-bold text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu Links */}
                      <div className="py-1 space-y-0.5">
                        {userMenuLinks.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                active
                                  ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/20'
                                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                              }`}
                            >
                              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/60 text-zinc-300">
                                <item.icon className="w-3.5 h-3.5 text-indigo-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-white/90">{item.name}</span>
                                <span className="text-[10px] text-zinc-500 font-normal">{item.description}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Logout option */}
                      <div className="pt-1 mt-1 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sair da conta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
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
              className="p-2 text-zinc-400 hover:text-white rounded-lg focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 pt-2 pb-6 space-y-4 max-h-[calc(100dvh-4rem)] overflow-y-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder={`Buscar ${searchType === 'movie' ? 'filmes' : 'séries'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80"
            />
            <button
              type="button"
              onClick={() => setSearchType(searchType === 'movie' ? 'serie' : 'movie')}
              className="px-3 py-2 bg-zinc-800 text-xs font-bold rounded-xl text-indigo-400 cursor-pointer"
            >
              {searchType === 'movie' ? 'FILMES' : 'SÉRIES'}
            </button>
          </form>

          {/* Links Principais */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2 px-1">Principal</span>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                if (link.auth && !isAuthenticated) return null;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                      active ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Links do Menu do Usuário (se autenticado) */}
          {isAuthenticated && (
            <div className="pt-2 border-t border-zinc-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2 px-1">Mais Opções</span>
              <div className="grid grid-cols-2 gap-2">
                {userMenuLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                        active ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      <link.icon className="w-4 h-4 text-indigo-400" />
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-300">{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/30 cursor-pointer"
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
                  className="flex-1 text-center py-2 text-sm font-medium text-zinc-300 bg-zinc-900 rounded-xl"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/20"
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
