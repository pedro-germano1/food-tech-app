import { NovoPedido, Pedido, PedidoPendente, Produto } from '../types';
import { api } from './index';
import { ApiError } from './erros';
import { gravarJson, lerJson } from './armazenamento';

/**
 * Sincronização de dados (estratégia "offline-first"):
 *  1. Leitura  -> tenta a rede; se falhar, usa a última cópia guardada no aparelho.
 *  2. Escrita  -> pedidos feitos sem internet entram numa fila e são reenviados depois.
 */

const CHAVE_CACHE_CARDAPIO = 'cache.cardapio';
const CHAVE_CACHE_PEDIDOS = 'cache.pedidos';
const CHAVE_FILA = 'fila.pedidos';

export interface ResultadoLeitura<T> {
  dados: T;
  origem: 'rede' | 'cache';
  atualizadoEm: string; // quando essa cópia foi obtida do servidor
}

interface CacheComData<T> {
  dados: T;
  atualizadoEm: string;
}

// ---------- Leitura com cache ----------

async function lerComCache<T>(
  chave: string,
  buscar: () => Promise<T>
): Promise<ResultadoLeitura<T>> {
  try {
    const dados = await buscar();
    const atualizadoEm = new Date().toISOString();
    await gravarJson<CacheComData<T>>(chave, { dados, atualizadoEm });
    return { dados, origem: 'rede', atualizadoEm };
  } catch (e) {
    if (e instanceof ApiError && e.codigo === 'REDE') {
      const cache = await lerJson<CacheComData<T> | null>(chave, null);
      if (cache) return { dados: cache.dados, origem: 'cache', atualizadoEm: cache.atualizadoEm };
    }
    throw e;
  }
}

export function obterCardapio(): Promise<ResultadoLeitura<Produto[]>> {
  return lerComCache(CHAVE_CACHE_CARDAPIO, () => api.listarProdutos());
}

export async function lerCardapioEmCache(): Promise<Produto[] | null> {
  const cache = await lerJson<CacheComData<Produto[]> | null>(CHAVE_CACHE_CARDAPIO, null);
  return cache ? cache.dados : null;
}

export function obterPedidos(): Promise<ResultadoLeitura<Pedido[]>> {
  return lerComCache(CHAVE_CACHE_PEDIDOS, () => api.listarPedidos());
}

// ---------- Fila de envio (pedidos feitos offline) ----------

async function lerFilaCompleta(): Promise<PedidoPendente[]> {
  return lerJson<PedidoPendente[]>(CHAVE_FILA, []);
}

async function gravarFila(fila: PedidoPendente[]): Promise<void> {
  await gravarJson(CHAVE_FILA, fila);
}

/** Pedidos pendentes de um usuário específico. */
export async function lerFila(usuarioId: number): Promise<PedidoPendente[]> {
  const todas = await lerFilaCompleta();
  return todas.filter((p) => p.usuarioId === usuarioId);
}

export async function enfileirarPedido(
  usuarioId: number,
  novo: NovoPedido,
  resumo: { total: number; quantidadeItens: number }
): Promise<PedidoPendente> {
  const pendente: PedidoPendente = {
    usuarioId,
    chaveIdempotencia: novo.chaveIdempotencia,
    criadoEm: new Date().toISOString(),
    novo,
    resumo,
  };
  const fila = await lerFilaCompleta();
  await gravarFila([...fila, pendente]);
  return pendente;
}

export interface ResultadoFila {
  enviados: Pedido[];
  restantes: PedidoPendente[];
  rejeitados: { pendente: PedidoPendente; motivo: string }[];
}

/**
 * Tenta enviar a fila do usuário, do pedido mais antigo para o mais novo.
 *  - Falha de rede / sessão expirada / erro 5xx: mantém o pedido na fila e para (tenta depois).
 *  - Erro de validação (4xx): o servidor recusou de forma definitiva; remove da fila e informa.
 */
export async function processarFila(usuarioId: number): Promise<ResultadoFila> {
  const minhas = await lerFila(usuarioId);
  const enviados: Pedido[] = [];
  const rejeitados: { pendente: PedidoPendente; motivo: string }[] = [];
  const resolvidos = new Set<string>(); // chaves que saem da fila

  for (let i = 0; i < minhas.length; i++) {
    const pendente = minhas[i];
    try {
      const pedido = await api.criarPedido(pendente.novo);
      enviados.push(pedido);
      resolvidos.add(pendente.chaveIdempotencia);
    } catch (e) {
      const definitivo =
        e instanceof ApiError &&
        e.codigo !== 'REDE' &&
        e.codigo !== 'NAO_AUTORIZADO' &&
        e.status >= 400 &&
        e.status < 500;
      if (definitivo) {
        rejeitados.push({ pendente, motivo: (e as ApiError).message });
        resolvidos.add(pendente.chaveIdempotencia);
      } else {
        break; // sem rede (ou erro do servidor): o restante continua na fila
      }
    }
  }

  // Relê a fila antes de gravar: um pedido novo pode ter entrado enquanto o envio acontecia.
  const atual = await lerFilaCompleta();
  const aposRemocao = atual.filter((p) => !resolvidos.has(p.chaveIdempotencia));
  await gravarFila(aposRemocao);
  return {
    enviados,
    restantes: aposRemocao.filter((p) => p.usuarioId === usuarioId),
    rejeitados,
  };
}
