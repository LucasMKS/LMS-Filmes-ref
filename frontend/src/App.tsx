import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { SeriesPage } from './pages/SeriesPage';
import { SerieDetailsPage } from './pages/SerieDetailsPage';
import { SeasonDetailsPage } from './pages/SeasonDetailsPage';
import { ActorsPage } from './pages/ActorsPage';
import { ActorDetailsPage } from './pages/ActorDetailsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RatingsPage } from './pages/RatingsPage';
import { ListsPage } from './pages/ListsPage';
import { ListDetailsPage } from './pages/ListDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

import { useAuthStore } from './store/useAuthStore';
import { useUserRatingsStore } from './store/useUserRatingsStore';
import { useFavoritesStore } from './store/useFavoritesStore';
import { useWatchlistStore } from './store/useWatchlistStore';
import { Film } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 min
    },
  },
});

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Footer Component
const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/80 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Film className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-zinc-300">LMS-Filmes Refatorado</span>
          <span>— Arquitetura Monolítica Modular de Alta Performance</span>
        </div>
        <p className="text-center md:text-right">
          Dados fornecidos via{' '}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            className="text-amber-500 hover:underline"
          >
            TMDB API
          </a>
          . Este produto usa a API do TMDB mas não é endossado ou certificado pelo TMDB.
        </p>
      </div>
    </footer>
  );
};

export const App: React.FC = () => {
  const { initialize, isAuthenticated } = useAuthStore();
  const { fetchRatings } = useUserRatingsStore();
  const { fetchFavorites } = useFavoritesStore();
  const { fetchWatchlist } = useWatchlistStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRatings();
      fetchFavorites();
      fetchWatchlist();
    }
  }, [isAuthenticated, fetchRatings, fetchFavorites, fetchWatchlist]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-amber-500/30 selection:text-amber-300 font-sans antialiased">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Media Catalog */}
              <Route path="/" element={<HomePage />} />
              <Route path="/filmes" element={<HomePage />} />
              <Route path="/filmes/:id" element={<MovieDetailsPage />} />
              <Route path="/series" element={<SeriesPage />} />
              <Route path="/series/:id" element={<SerieDetailsPage />} />
              <Route path="/series/:id/season/:seasonNumber" element={<SeasonDetailsPage />} />
              <Route path="/atores" element={<ActorsPage />} />
              <Route path="/atores/:id" element={<ActorDetailsPage />} />

              {/* Protected User Routes */}
              <Route
                path="/watchlist"
                element={
                  <ProtectedRoute>
                    <WatchlistPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favoritos"
                element={
                  <ProtectedRoute>
                    <FavoritesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/avaliados"
                element={
                  <ProtectedRoute>
                    <RatingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/listas"
                element={
                  <ProtectedRoute>
                    <ListsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/listas/:id"
                element={
                  <ProtectedRoute>
                    <ListDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/listas/atores/:id"
                element={
                  <ProtectedRoute>
                    <ListDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
              <Route path="/recuperar-senha" element={<ResetPasswordPage />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster position="bottom-right" richColors theme="dark" />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
