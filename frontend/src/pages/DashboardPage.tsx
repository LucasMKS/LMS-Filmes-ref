import React, { useState, useEffect } from 'react';
import { dashboardApi, mediaStatsApi } from '../services/api';
import { DashboardStats, MediaBalance } from '../types';
import { 
  BarChart2, 
  Film, 
  Tv, 
  CheckCircle2, 
  Clock, 
  Star, 
  Layers, 
  TrendingUp, 
  Award 
} from 'lucide-react';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [balance, setBalance] = useState<MediaBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, balRes] = await Promise.allSettled([
        dashboardApi.getStats(),
        mediaStatsApi.getBalance(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data);
      }
    } catch {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const moviePercent = balance?.moviePercentage || 50;
  const seriePercent = balance?.seriePercentage || 50;

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-amber-400" />
            Estatísticas de Consumo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Métricas detalhadas sobre seus hábitos de cinema, maratonas e notas médias
          </p>
        </div>

        {/* Highlight Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filmes Avaliados</span>
              <Film className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalMoviesRated || 0}</p>
            <p className="text-[11px] text-zinc-500">Média: {stats?.averageMovieRating?.toFixed(1) || '0.0'}/10</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Séries Avaliadas</span>
              <Tv className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalSeriesRated || 0}</p>
            <p className="text-[11px] text-zinc-500">Média: {stats?.averageSerieRating?.toFixed(1) || '0.0'}/10</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Episódios Vistos</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalEpisodesWatched || 0}</p>
            <p className="text-[11px] text-zinc-500">Temporadas concluídas</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tempo Total</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {stats?.totalTimeWatchedHours || 0}<span className="text-base text-zinc-500 font-normal">h</span>
            </p>
            <p className="text-[11px] text-zinc-500">
              ~{stats?.totalTimeWatchedDays ? stats.totalTimeWatchedDays.toFixed(1) : '0'} dias de tela
            </p>
          </div>
        </div>

        {/* Media Balance Section */}
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Balanço de Consumo: Filmes vs Séries
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Proporção de produções cinematográficas contra episódios seriados
              </p>
            </div>
            <div className="text-xs font-bold text-amber-400">
              {moviePercent.toFixed(0)}% Filmes • {seriePercent.toFixed(0)}% Séries
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-4 rounded-full bg-zinc-800 overflow-hidden flex">
            <div
              style={{ width: `${moviePercent}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
              title={`Filmes: ${moviePercent.toFixed(1)}%`}
            />
            <div
              style={{ width: `${seriePercent}%` }}
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
              title={`Séries: ${seriePercent.toFixed(1)}%`}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-zinc-400 mt-3 pt-2 border-t border-zinc-800/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Filmes ({balance?.totalMovies || 0})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Séries ({balance?.totalSeries || 0})
            </span>
          </div>
        </div>

        {/* Rating Distribution */}
        {stats?.ratingDistribution && (
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Distribuição de Notas (1 a 10)
            </h2>

            <div className="space-y-2.5">
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => {
                const count = stats.ratingDistribution[score] || 0;
                const totalEvaluations =
                  (stats.totalMoviesRated || 0) + (stats.totalSeriesRated || 0);
                const pct = totalEvaluations > 0 ? (count / totalEvaluations) * 100 : 0;

                return (
                  <div key={score} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-bold text-zinc-300 text-right">{score} ★</span>
                    <div className="flex-1 h-3.5 rounded-full bg-zinc-800/80 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      />
                    </div>
                    <span className="w-12 text-zinc-400 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
