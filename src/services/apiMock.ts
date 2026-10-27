import { config } from '../config';
import {
  DadosRegistro,
  EventoStatus,
  ItemPedido,
  Modalidade,
  NovoPedido,
  Pedido,
  Produto,
  SessaoAuth,
  StatusPedido,
  Usuario,
} from '../types';
import { arredondar, calcularResumo, descreverPersonalizacao, precoUnitario } from '../domain/preco';
import { CARDAPIO_MOCK } from './cardapioMock';
import { gravarJson, lerJson } from './armazenamento';
import { ApiError } from './erros';
import { obterToken } from './tokenAtual';
import { Api } from './tipos';

/**
 * API SIMULADA: reproduz o comportamento do servidor para que o app possa ser
 * demonstrado sem backend. Os dados ficam no AsyncStorage do próprio aparelho.
 */

const LATENCIA_MS = 450;

// FLUXO DE DEMONSTRAÇÃO: o mock avança o pedido sozinho, em poucos segundos, só para
// mostrar as telas. Na API real, quem muda o status é o estabelecimento.
function etapasDe(modalidade: Modalidade): { status: StatusPedido; aposSegundos: number }[] {
  return [
    { status: 'Recebido', aposSegundos: 0 },
    { status: 'Confirmado', aposSegundos: 10 },
    { status: 'EmPreparo', aposSegundos: 25 },
    { status: modalidade === 'Retirada' ? 'ProntoParaRetirada' : 'SaiuParaEntrega', aposSegundos: 55 },
    { status: 'Entregue', aposSegundos: 100 },
  ];
}

interface UsuarioSalvo extends Usuario {
  senha: string; // somente no mock; a API real armazena apenas o hash da senha
}

interface PedidoSalvo extends Pedido {
  usuarioId: number;
  chaveIdempotencia: string;
}

const CHAVE_USUARIOS = 'mock.usuarios';
const CHAVE_PEDIDOS = 'mock.pedidos';

let offlineSimulado = false;
export function definirOfflineSimulado(valor: boolean): void {
  offlineSimulado = valor;
}
export function estaOfflineSimulado(): boolean {
  return offlineSimulado;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simularRede(): Promise<void> {
  await esperar(LATENCIA_MS);
  if (offlineSimulado) {
    throw new ApiError('Sem conexão com o servidor (simulada).', 0, 'REDE');
  }
}

async function usuarios(): Promise<UsuarioSalvo[]> {
  const lista = await lerJson<UsuarioSalvo[]>(CHAVE_USUARIOS, []);
  if (lista.length === 0) {
    const demo: UsuarioSalvo = {
      id: 1,
      nome: 'Cliente Demo',
      email: 'demo@foodtech.com',
      senha: '123456',
    };
    await gravarJson(CHAVE_USUARIOS, [demo]);
    return [demo];
  }
  return lista;
}

function criarSessao(u: UsuarioSalvo): SessaoAuth {
  const expiraEm = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 horas
  return {
    token: 'mock.' + u.id + '.' + Date.now(),
    expiraEm,
    usuario: { id: u.id, nome: u.nome, email: u.email },
  };
}

function usuarioIdDoToken(): number {
  const token = obterToken();
  const partes = token ? token.split('.') : [];
  if (partes.length < 3 || partes[0] !== 'mock') {
    throw new ApiError('Sessão inválida.', 401, 'NAO_AUTORIZADO');
  }
  return Number(partes[1]);
}

/** Calcula em que etapa o pedido está, conforme o tempo decorrido desde a criação. */
function atualizarStatus(p: PedidoSalvo): PedidoSalvo {
  const decorrido = (Date.now() - new Date(p.criadoEm).getTime()) / 1000;
  const historico: EventoStatus[] = [];
  let atual: StatusPedido = 'Recebido';
  for (const etapa of etapasDe(p.modalidade ?? 'Entrega')) {
    if (decorrido >= etapa.aposSegundos) {
      atual = etapa.status;
      historico.push({
        status: etapa.status,
        em: new Date(new Date(p.criadoEm).getTime() + etapa.aposSegundos * 1000).toISOString(),
      });
    }
  }
  return { ...p, status: atual, historico };
}

function paraPedido(p: PedidoSalvo): Pedido {
  const { usuarioId, chaveIdempotencia, ...pedido } = p;
  void usuarioId;
  void chaveIdempotencia;
  // Pedidos gravados por versões anteriores do app não tinham estes campos.
  return {
    ...pedido,
    modalidade: pedido.modalidade ?? 'Entrega',
    desconto: pedido.desconto ?? 0,
    itens: pedido.itens.map((i) => ({
      ...i,
      adicionaisIds: i.adicionaisIds ?? [],
      ingredientesRemovidos: i.ingredientesRemovidos ?? [],
      detalhes: i.detalhes ?? [],
    })),
  };
}

export const apiMock: Api = {
  async login(email: string, senha: string): Promise<SessaoAuth> {
    await simularRede();
    const lista = await usuarios();
    const u = lista.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.senha !== senha) {
      throw new ApiError('E-mail ou senha incorretos.', 400, 'HTTP');
    }
    return criarSessao(u);
  },

  async registrar(dados: DadosRegistro): Promise<SessaoAuth> {
    await simularRede();
    const lista = await usuarios();
    if (lista.some((x) => x.email.toLowerCase() === dados.email.trim().toLowerCase())) {
      throw new ApiError('Já existe uma conta com este e-mail.', 409, 'HTTP');
    }
    const novo: UsuarioSalvo = {
      id: lista.length + 1,
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      senha: dados.senha,
    };
    await gravarJson(CHAVE_USUARIOS, [...lista, novo]);
    return criarSessao(novo);
  },

  async listarProdutos(): Promise<Produto[]> {
    await simularRede();
    return CARDAPIO_MOCK;
  },

  async criarPedido(novo: NovoPedido): Promise<Pedido> {
    await simularRede();
    const usuarioId = usuarioIdDoToken();
    const todos = await lerJson<PedidoSalvo[]>(CHAVE_PEDIDOS, []);

    // Idempotência: se o mesmo envio chegar duas vezes, devolve o pedido já criado.
    const existente = todos.find((p) => p.chaveIdempotencia === novo.chaveIdempotencia);
    if (existente) return paraPedido(atualizarStatus(existente));

    if (novo.itens.length === 0) {
      throw new ApiError('O pedido precisa ter ao menos um item.', 400, 'VALIDACAO');
    }
    if (novo.modalidade !== 'Entrega' && novo.modalidade !== 'Retirada') {
      throw new ApiError('Escolha entrega ou retirada.', 400, 'VALIDACAO');
    }
    const endereco = novo.modalidade === 'Entrega' ? novo.enderecoEntrega.trim() : '';
    if (novo.modalidade === 'Entrega' && endereco.length < 8) {
      throw new ApiError('Informe um endereço de entrega válido.', 400, 'VALIDACAO');
    }

    // O servidor é quem define preços: nunca confiamos no valor enviado pelo app.
    const itens: ItemPedido[] = [];
    const paraResumo: { chave: string; produto: Produto; quantidade: number; personalizacao: any }[] = [];
    for (const i of novo.itens) {
      const produto = CARDAPIO_MOCK.find((p) => p.id === i.produtoId);
      if (!produto || !produto.disponivel) {
        throw new ApiError('Um dos itens não está disponível no momento.', 400, 'VALIDACAO');
      }
      if (!Number.isInteger(i.quantidade) || i.quantidade < 1 || i.quantidade > 20) {
        throw new ApiError('Quantidade inválida.', 400, 'VALIDACAO');
      }
      const pers = {
        tamanhoId: i.tamanhoId,
        adicionaisIds: (i.adicionaisIds ?? []).filter((id) => (produto.adicionais ?? []).some((a) => a.id === id)),
        ingredientesRemovidos: (i.ingredientesRemovidos ?? []).filter((n) => (produto.ingredientes ?? []).includes(n)),
        observacao: (i.observacao ?? '').trim().slice(0, 140),
      };
      itens.push({
        produtoId: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        imagemUrl: produto.imagemUrl,
        precoUnitario: precoUnitario(produto, pers),
        quantidade: i.quantidade,
        observacao: pers.observacao,
        tamanhoId: pers.tamanhoId,
        adicionaisIds: pers.adicionaisIds,
        ingredientesRemovidos: pers.ingredientesRemovidos,
        detalhes: descreverPersonalizacao(produto, pers),
      });
      paraResumo.push({ chave: '', produto, quantidade: i.quantidade, personalizacao: pers });
    }
    const valores = calcularResumo(paraResumo, novo.modalidade);
    const criadoEm = new Date().toISOString();

    const pedido: PedidoSalvo = {
      id: 1000 + todos.length + 1,
      usuarioId,
      chaveIdempotencia: novo.chaveIdempotencia,
      criadoEm,
      status: 'Recebido',
      modalidade: novo.modalidade,
      itens,
      subtotal: valores.subtotal,
      desconto: valores.desconto,
      taxaEntrega: valores.taxaEntrega,
      total: arredondar(valores.total),
      enderecoEntrega: endereco,
      formaPagamento: novo.formaPagamento,
      previsaoEntregaMin:
        novo.modalidade === 'Retirada' ? config.PREVISAO_RETIRADA_MIN : config.PREVISAO_ENTREGA_MIN,
      historico: [{ status: 'Recebido', em: criadoEm }],
    };
    await gravarJson(CHAVE_PEDIDOS, [...todos, pedido]);
    return paraPedido(pedido);
  },

  async listarPedidos(): Promise<Pedido[]> {
    await simularRede();
    const usuarioId = usuarioIdDoToken();
    const todos = await lerJson<PedidoSalvo[]>(CHAVE_PEDIDOS, []);
    return todos
      .filter((p) => p.usuarioId === usuarioId)
      .map((p) => paraPedido(atualizarStatus(p)))
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
  },

  async obterPedido(id: number): Promise<Pedido> {
    await simularRede();
    const usuarioId = usuarioIdDoToken();
    const todos = await lerJson<PedidoSalvo[]>(CHAVE_PEDIDOS, []);
    const p = todos.find((x) => x.id === id && x.usuarioId === usuarioId);
    if (!p) throw new ApiError('Pedido não encontrado.', 404, 'HTTP');
    return paraPedido(atualizarStatus(p));
  },
};
