import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { Film, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Informe seu e-mail cadastrado');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setEmailSent(true);
      toast.success('Instruções enviadas para o seu e-mail!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao solicitar redefinição');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Token inválido ou expirado');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      toast.success('Senha atualizada com sucesso! Faça login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Token expirado ou inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              LMS<span className="text-amber-500">Filmes</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">
            {token ? 'Definir Nova Senha' : 'Recuperar Senha'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {token
              ? 'Digite sua nova senha abaixo'
              : 'Enviaremos um link de recuperação para o seu e-mail'}
          </p>
        </div>

        {token ? (
          /* Redefinição com token */
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Atualizar Senha'}
            </button>
          </form>
        ) : emailSent ? (
          /* Sucesso ao enviar email */
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">E-mail enviado com sucesso!</p>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Verifique sua caixa de entrada (ou spam) no endereço <span className="text-zinc-200">{email}</span> e siga as orientações.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        ) : (
          /* Solicitar email */
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Enviar Link de Recuperação
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-6 pt-6 border-t border-zinc-900 text-xs text-zinc-400">
          <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
};
