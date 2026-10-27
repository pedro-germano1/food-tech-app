import { config } from '../config';
import { DadosRegistro, NovoPedido, Pedido, Produto, SessaoAuth } from '../types';
import { ApiError } from './erros';
import { dispararNaoAutorizado, obterToken } from './tokenAtual';
import { Api } from './tipos';

interface Opcoes {
  metodo?: 'GET' | 'POST';
  corpo?: unknown;
  autenticada?: boolean;
}

async function requisicao<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = 'GET', corpo, autenticada = true } = opcoes;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = obterToken();
  if (autenticada && token) headers.Authorization = 'Bearer ' + token;

  // Tempo limite: sem isso, uma rede ruim deixaria o app "pendurado".
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), config.TIMEOUT_MS);

  let resposta: Response;
  try {
    resposta = await fetch(config.API_URL + caminho, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controlador.signal,
    });
  } catch {
    throw new ApiError('Sem conexão com o servidor.', 0, 'REDE');
  } finally {
    clearTimeout(temporizador);
  }

  if (!resposta.ok) {
    let mensagem = 'Não foi possível concluir a operação (erro ' + resposta.status + ').';
    try {
      const dados = await resposta.json();
      mensagem = dados.mensagem || dados.message || dados.title || mensagem;
    } catch {
      // A resposta de erro não tinha corpo em JSON: mantém a mensagem padrão.
    }
    if (resposta.status === 401 && autenticada) {
      dispararNaoAutorizado();
      throw new ApiError('Sua sessão expirou. Entre novamente.', 401, 'NAO_AUTORIZADO');
    }
    throw new ApiError(mensagem, resposta.status, resposta.status === 401 ? 'NAO_AUTORIZADO' : 'HTTP');
  }

  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

export const apiHttp: Api = {
  login: (email: string, senha: string) =>
    requisicao<SessaoAuth>('/api/auth/login', {
      metodo: 'POST',
      corpo: { email, senha },
      autenticada: false,
    }),

  registrar: (dados: DadosRegistro) =>
    requisicao<SessaoAuth>('/api/auth/registro', {
      metodo: 'POST',
      corpo: dados,
      autenticada: false,
    }),

  listarProdutos: () => requisicao<Produto[]>('/api/produtos'),

  criarPedido: (novo: NovoPedido) =>
    requisicao<Pedido>('/api/pedidos', { metodo: 'POST', corpo: novo }),

  listarPedidos: () => requisicao<Pedido[]>('/api/pedidos'),

  obterPedido: (id: number) => requisicao<Pedido>('/api/pedidos/' + id),
};
