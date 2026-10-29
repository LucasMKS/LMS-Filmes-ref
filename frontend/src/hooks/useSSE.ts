import { useEffect } from 'react';
import { toast } from 'sonner';

const SSE_CHANNEL_NAME = 'lms_filmes_sse_channel';
const SSE_LOCK_NAME = 'lms_filmes_sse_leader_lock';

interface SseNotificationPayload {
  title?: string;
  message?: string;
  link?: string;
  [key: string]: unknown;
}

interface SseBroadcastMessage {
  type: string;
  data: SseNotificationPayload;
}

function displayToast(type: string, data: SseNotificationPayload) {
  if (type === 'POPCORN_SESSION') {
    toast.info(data.title || '🍿 Sessão Pipoca!', {
      description: data.message,
      action: data.link
        ? {
            label: 'Ver Filme',
            onClick: () => {
              window.location.href = data.link!;
            },
          }
        : undefined,
      duration: 10000,
    });
  } else if (type === 'NOTIFICATION') {
    toast(data.title || 'Nova Notificação', {
      description: data.message,
    });
  }
}

export function useSSE() {
  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let channel: BroadcastChannel | null = null;
    let abortController: AbortController | null = null;

    // 1. Configura BroadcastChannel para receber eventos repassados pela aba Líder
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(SSE_CHANNEL_NAME);
        channel.onmessage = (event: MessageEvent<SseBroadcastMessage>) => {
          if (!isMounted || !event.data) return;
          displayToast(event.data.type, event.data.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel não suportado neste ambiente:', err);
      }
    }

    const connectSSE = () => {
      if (!isMounted || eventSource) return;

      const url = '/notifications/stream';
      try {
        eventSource = new EventSource(url);

        const handleIncoming = (type: string, rawData: string) => {
          let parsed: SseNotificationPayload;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = { message: rawData };
          }

          // Exibe o toast na aba Líder
          displayToast(type, parsed);

          // Transmite para as outras abas abertas
          if (channel) {
            try {
              channel.postMessage({ type, data: parsed });
            } catch (err) {
              console.warn('Erro ao transmitir evento via BroadcastChannel:', err);
            }
          }
        };

        eventSource.addEventListener('POPCORN_SESSION', (e) => {
          handleIncoming('POPCORN_SESSION', e.data);
        });

        eventSource.addEventListener('NOTIFICATION', (e) => {
          handleIncoming('NOTIFICATION', e.data);
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isMounted) {
            // Tenta reconectar após 10 segundos
            retryTimeout = setTimeout(connectSSE, 10000);
          }
        };
      } catch (err) {
        console.error('Erro ao conectar SSE:', err);
      }
    };

    const disconnectSSE = () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    // 2. Eleição de Líder via Web Locks API (navigator.locks)
    // Permite que apenas UMA aba mantenha o streaming SSE aberto,
    // evitando esgotar o limite de conexões simultâneas HTTP/1.1 do navegador (máx 6 conexões por domínio).
    const supportsWebLocks = typeof navigator !== 'undefined' && 'locks' in navigator && !!channel;

    if (supportsWebLocks) {
      abortController = new AbortController();

      navigator.locks
        .request(SSE_LOCK_NAME, { signal: abortController.signal }, () => {
          return new Promise<void>((resolve) => {
            if (!isMounted) {
              resolve();
              return;
            }

            // Esta aba foi eleita a Líder! Inicia a conexão SSE única.
            connectSSE();

            const onAbort = () => {
              disconnectSSE();
              resolve();
            };

            if (abortController?.signal.aborted) {
              onAbort();
            } else {
              abortController?.signal.addEventListener('abort', onAbort, { once: true });
            }
          });
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('Aviso no lock de líder SSE:', err);
          }
        });
    } else {
      // Fallback para navegadores sem suporte a Web Locks
      connectSSE();
    }

    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
      disconnectSSE();
      if (channel) {
        channel.close();
      }
    };
  }, []);
}
