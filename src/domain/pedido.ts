import { Pedido, Personalizacao, Produto } from '../types';

export interface ItemParaRefazer {
  produto: Produto;
  quantidade: number;
  personalizacao: Personalizacao;
}

/**
 * Monta os itens de um pedido antigo para colocá-los de novo no carrinho.
 * Itens que saíram do cardápio ou estão indisponíveis são ignorados e listados em `ignorados`.
 * Opções (adicionais, ingredientes) que não existem mais são descartadas.
 */
export function itensParaRefazer(
  pedido: Pedido,
  produtos: Produto[]
): { itens: ItemParaRefazer[]; ignorados: string[] } {
  const itens: ItemParaRefazer[] = [];
  const ignorados: string[] = [];
  for (const i of pedido.itens) {
    const produto = produtos.find((p) => p.id === i.produtoId);
    if (!produto || !produto.disponivel) {
      ignorados.push(i.nome);
      continue;
    }
    const tamanhoValido = produto.tamanhos?.some((t) => t.id === i.tamanhoId);
    itens.push({
      produto,
      quantidade: i.quantidade,
      personalizacao: {
        tamanhoId: tamanhoValido ? i.tamanhoId : produto.tamanhos?.[0]?.id,
        adicionaisIds: (i.adicionaisIds ?? []).filter((id) => (produto.adicionais ?? []).some((a) => a.id === id)),
        ingredientesRemovidos: (i.ingredientesRemovidos ?? []).filter((n) => (produto.ingredientes ?? []).includes(n)),
        observacao: i.observacao ?? '',
      },
    });
  }
  return { itens, ignorados };
}
