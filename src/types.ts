export type Categoria = 'Burgers' | 'Combos' | 'Acompanhamentos' | 'Bebidas' | 'Sobremesas';

/** Item extra pago que o cliente pode acrescentar (ex.: bacon extra). */
export interface Adicional {
  id: string;
  nome: string;
  preco: number;
}

/** Opção de tamanho. A primeira da lista é a padrão (acréscimo 0). */
export interface OpcaoTamanho {
  id: string;
  nome: string;
  acrescimo: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  /** Quando existe e é menor que `preco`, o produto está em promoção. */
  precoPromocional?: number;
  categoria: Categoria;
  disponivel: boolean;
  /** Chave de uma imagem que acompanha o app (ver src/assets/imagens.ts). */
  imagem?: string;
  /** URL da imagem, quando a API real fornecer. Tem prioridade sobre `imagem`. */
  imagemUrl?: string;
  /** Ingredientes que o cliente pode pedir para retirar. */
  ingredientes?: string[];
  adicionais?: Adicional[];
  tamanhos?: OpcaoTamanho[];
  maisPedido?: boolean;
  vegetariano?: boolean;
}

/** Escolhas do cliente para um item. */
export interface Personalizacao {
  tamanhoId?: string;
  adicionaisIds: string[];
  ingredientesRemovidos: string[];
  observacao: string;
}

export interface ItemCarrinho {
  /** Identifica produto + personalização: o mesmo lanche com escolhas diferentes são itens distintos. */
  chave: string;
  produto: Produto;
  quantidade: number;
  personalizacao: Personalizacao;
}

export type StatusPedido =
  | 'Recebido'
  | 'Confirmado'
  | 'EmPreparo'
  | 'SaiuParaEntrega'
  | 'ProntoParaRetirada'
  | 'Entregue'
  | 'Cancelado';

export type Modalidade = 'Entrega' | 'Retirada';

export type FormaPagamento = 'Pix' | 'Cartao' | 'Dinheiro';

export interface ItemPedido {
  produtoId: number;
  nome: string;
  imagem?: string;
  imagemUrl?: string;
  precoUnitario: number;
  quantidade: number;
  observacao: string;
  tamanhoId?: string;
  adicionaisIds: string[];
  ingredientesRemovidos: string[];
  /** Linhas prontas para exibir: "Tamanho: Grande", "+ Bacon extra", "Sem cebola". */
  detalhes: string[];
}

export interface EventoStatus {
  status: StatusPedido;
  em: string; // data/hora ISO
}

export interface Pedido {
  id: number;
  criadoEm: string;
  status: StatusPedido;
  modalidade: Modalidade;
  itens: ItemPedido[];
  subtotal: number;
  desconto: number;
  taxaEntrega: number;
  total: number;
  /** Vazio quando a modalidade é Retirada. */
  enderecoEntrega: string;
  formaPagamento: FormaPagamento;
  previsaoEntregaMin: number;
  historico: EventoStatus[];
}

export interface ItemNovoPedido {
  produtoId: number;
  quantidade: number;
  observacao: string;
  tamanhoId?: string;
  adicionaisIds: string[];
  ingredientesRemovidos: string[];
}

/** Corpo enviado para POST /api/pedidos */
export interface NovoPedido {
  chaveIdempotencia: string; // evita pedido duplicado se o envio for repetido
  modalidade: Modalidade;
  itens: ItemNovoPedido[];
  enderecoEntrega: string;
  formaPagamento: FormaPagamento;
}

/** Pedido criado sem conexão, aguardando envio na fila de sincronização. */
export interface PedidoPendente {
  usuarioId: number; // a fila pertence ao usuário que fez o pedido
  chaveIdempotencia: string;
  criadoEm: string;
  novo: NovoPedido;
  resumo: { total: number; quantidadeItens: number };
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

export interface SessaoAuth {
  token: string;
  expiraEm: string; // data/hora ISO
  usuario: Usuario;
}

export interface DadosRegistro {
  nome: string;
  email: string;
  senha: string;
}

/** Endereço salvo no aparelho (a API recebe apenas o texto final no pedido). */
export interface Endereco {
  id: string;
  apelido: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento: string;
}
