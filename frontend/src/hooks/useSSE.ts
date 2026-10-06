import { useEffect } from 'react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

export function useSSE() {
  useEffect(() => {
    const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
    const url = `/notifications/stream`;

    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(url);

        eventSource.addEventListener('POPCORN_SESSION', (e) => {
          try {
            const data = JSON.parse(e.data);
            toast.info(data.title || '🍿 Sessão Pipoca!', {
              description: data.message,
              action: data.link ? {
                label: 'Ver Filme',
                onClick: () => {
                  window.location.href = data.link;
                },
              } : undefined,
              duration: 10000,
            });
          } catch {
            toast.info('🍿 Sessão Pipoca!', { description: e.data });
          }
        });

        eventSource.addEventListener('NOTIFICATION', (e) => {
          try {
            const data = JSON.parse(e.data);
            toast(data.title || 'Nova Notificação', {
              description: data.message,
            });
          } catch {
            toast('Nova Notificação', { description: e.data });
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          // Reconexão exponencial simples
          retryTimeout = setTimeout(connect, 10000);
        };
      } catch (err) {
        console.error('Erro ao conectar SSE:', err);
      }
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);
}
