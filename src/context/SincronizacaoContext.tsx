import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useToast } from '../components/Toast';
import { config } from '../config';
import { Pedido, PedidoPendente } from '../types';
import { enfileirarPedido, lerFila, processarFila } from '../services/sincronizacao';
import { NovoPedido } from '../types';
import { useAuth } from './AuthContext';

interface SincValor {
  pendentes: PedidoPendente[];
  sincronizando: boolean;
  ultimaSincronizacao: Date | null;
  /** Guarda um pedido na fila (usado quando não há internet no momento de confirmar). */
  guardarParaDepois(novo: NovoPedido, resumo: { total: number; quantidadeItens: number }): Promise<void>;
  sincronizarAgora(): Promise<void>;
  /** Contador que muda a cada envio bem-sucedido; telas de pedidos usam para recarregar. */
  versaoPedidos: number;
}

const SincContext = createContext<SincValor | undefined>(undefined);

export function SincronizacaoProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const usuarioId = usuario ? usuario.id : 0;
  const [pendentes, setPendentes] = useState<PedidoPendente[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSincronizacao, setUltima] = useState<Date | null>(null);
  const [versaoPedidos, setVersao] = useState(0);
  const ocupado = useRef(false);

  const sincronizarAgora = useCallback(async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    setSincronizando(true);
    try {
      const fila = await lerFila(usuarioId);
      if (fila.length === 0) {
        setPendentes([]);
        return;
      }
      const resultado = await processarFila(usuarioId);
      setPendentes(resultado.restantes);
      if (resultado.enviados.length > 0) {
        setUltima(new Date());
        setVersao((v) => v + 1);
        const ids = resultado.enviados.map((p: Pedido) => '#' + p.id).join(', ');
        toast.mostrar('Conexão restabelecida: pedido ' + ids + ' enviado à hamburgueria.');
      }
      if (resultado.rejeitados.length > 0) {
        toast.mostrar('Pedido não aceito: ' + resultado.rejeitados.map((r) => r.motivo).join(' '), 'erro');
      }
    } finally {
      ocupado.current = false;
      setSincronizando(false);
    }
  }, [usuarioId, toast]);

  // Carrega a fila salva ao abrir o app.
  useEffect(() => {
    lerFila(usuarioId).then((fila) => {
      setPendentes(fila);
      if (fila.length > 0) sincronizarAgora();
    });
  }, [usuarioId, sincronizarAgora]);

  // Reenvia periodicamente enquanto houver pedidos na fila.
  useEffect(() => {
    if (pendentes.length === 0) return;
    const id = setInterval(sincronizarAgora, config.INTERVALO_SYNC_MS);
    return () => clearInterval(id);
  }, [pendentes.length, sincronizarAgora]);

  // Ao voltar para o app (vindo do segundo plano), tenta sincronizar.
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') sincronizarAgora();
    });
    return () => assinatura.remove();
  }, [sincronizarAgora]);

  const guardarParaDepois = useCallback(
    async (novo: NovoPedido, resumo: { total: number; quantidadeItens: number }) => {
      const pendente = await enfileirarPedido(usuarioId, novo, resumo);
      setPendentes((atual) => [...atual, pendente]);
    },
    [usuarioId]
  );

  const valor = useMemo(
    () => ({
      pendentes,
      sincronizando,
      ultimaSincronizacao,
      guardarParaDepois,
      sincronizarAgora,
      versaoPedidos,
    }),
    [pendentes, sincronizando, ultimaSincronizacao, guardarParaDepois, sincronizarAgora, versaoPedidos]
  );

  return <SincContext.Provider value={valor}>{children}</SincContext.Provider>;
}

export function useSincronizacao(): SincValor {
  const ctx = useContext(SincContext);
  if (!ctx) throw new Error('useSincronizacao deve ser usado dentro de <SincronizacaoProvider>');
  return ctx;
}
