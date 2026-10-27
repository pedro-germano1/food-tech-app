import { config } from '../config';
import { ItemCarrinho, Modalidade, Personalizacao, Produto } from '../types';

/**
 * Regras de preço em um só lugar (usadas pelo app e pelo mock da API).
 * O servidor continua sendo a fonte oficial: o app só EXIBE a estimativa.
 */

export const PERSONALIZACAO_VAZIA: Personalizacao = {
  tamanhoId: undefined,
  adicionaisIds: [],
  ingredientesRemovidos: [],
  observacao: '',
};

export function emPromocao(p: Produto): boolean {
  return p.precoPromocional !== undefined && p.precoPromocional < p.preco;
}

export function percentualDesconto(p: Produto): number {
  if (!emPromocao(p)) return 0;
  return Math.round((1 - (p.precoPromocional as number) / p.preco) * 100);
}

export function tamanhoPadrao(p: Produto): string | undefined {
  return p.tamanhos && p.tamanhos.length > 0 ? p.tamanhos[0].id : undefined;
}

export function personalizacaoInicial(p: Produto): Personalizacao {
  return { ...PERSONALIZACAO_VAZIA, tamanhoId: tamanhoPadrao(p) };
}

function extras(p: Produto, pers: Personalizacao): number {
  const tam = p.tamanhos?.find((t) => t.id === pers.tamanhoId);
  const somaAdicionais = (p.adicionais ?? [])
    .filter((a) => pers.adicionaisIds.includes(a.id))
    .reduce((s, a) => s + a.preco, 0);
  return (tam ? tam.acrescimo : 0) + somaAdicionais;
}

/** Preço de tabela de uma unidade, já com tamanho e adicionais (sem promoção). */
export function precoCheio(p: Produto, pers: Personalizacao): number {
  return arredondar(p.preco + extras(p, pers));
}

/** Preço cobrado de uma unidade (com promoção, se houver). */
export function precoUnitario(p: Produto, pers: Personalizacao): number {
  const base = emPromocao(p) ? (p.precoPromocional as number) : p.preco;
  return arredondar(base + extras(p, pers));
}

export function arredondar(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Linhas legíveis da personalização: "Tamanho: Grande", "+ Bacon extra", "Sem cebola". */
export function descreverPersonalizacao(p: Produto, pers: Personalizacao): string[] {
  const linhas: string[] = [];
  const tam = p.tamanhos?.find((t) => t.id === pers.tamanhoId);
  if (tam && p.tamanhos && p.tamanhos.length > 1) linhas.push('Tamanho: ' + tam.nome);
  (p.adicionais ?? [])
    .filter((a) => pers.adicionaisIds.includes(a.id))
    .forEach((a) => linhas.push('+ ' + a.nome));
  pers.ingredientesRemovidos.forEach((i) => linhas.push('Sem ' + i.toLowerCase()));
  return linhas;
}

export function chaveItem(p: Produto, pers: Personalizacao): string {
  return [
    p.id,
    pers.tamanhoId ?? '',
    [...pers.adicionaisIds].sort().join(','),
    [...pers.ingredientesRemovidos].sort().join(','),
    pers.observacao.trim().toLowerCase(),
  ].join('|');
}

export interface ResumoValores {
  subtotal: number; // a preço de tabela
  desconto: number; // economia das promoções
  taxaEntrega: number;
  total: number;
  quantidadeItens: number;
  faltaParaFreteGratis: number; // 0 quando já é grátis ou não é entrega
}

export function calcularResumo(itens: ItemCarrinho[], modalidade: Modalidade): ResumoValores {
  let subtotal = 0;
  let cobrado = 0;
  let quantidadeItens = 0;
  for (const i of itens) {
    subtotal += precoCheio(i.produto, i.personalizacao) * i.quantidade;
    cobrado += precoUnitario(i.produto, i.personalizacao) * i.quantidade;
    quantidadeItens += i.quantidade;
  }
  subtotal = arredondar(subtotal);
  cobrado = arredondar(cobrado);
  const desconto = arredondar(subtotal - cobrado);
  const entrega = modalidade === 'Entrega' && itens.length > 0;
  const gratis = cobrado >= config.FRETE_GRATIS_ACIMA;
  const taxaEntrega = entrega && !gratis ? config.TAXA_ENTREGA : 0;
  return {
    subtotal,
    desconto,
    taxaEntrega,
    total: arredondar(cobrado + taxaEntrega),
    quantidadeItens,
    faltaParaFreteGratis: entrega && !gratis ? arredondar(config.FRETE_GRATIS_ACIMA - cobrado) : 0,
  };
}
