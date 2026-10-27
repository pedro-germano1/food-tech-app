import assert from 'node:assert/strict';
import { CARDAPIO_MOCK } from '../src/services/cardapioMock';
import {
  calcularResumo,
  chaveItem,
  descreverPersonalizacao,
  emPromocao,
  percentualDesconto,
  personalizacaoInicial,
  precoCheio,
  precoUnitario,
} from '../src/domain/preco';
import { itensParaRefazer } from '../src/domain/pedido';
import { normalizar, pedidoFinalizado, primeiroNome, saudacao } from '../src/utils/formatar';
import { ItemCarrinho, Pedido } from '../src/types';

const p = (id: number) => CARDAPIO_MOCK.find((x) => x.id === id)!;
const item = (id: number, quantidade: number, parcial: Partial<ItemCarrinho['personalizacao']> = {}): ItemCarrinho => {
  const produto = p(id);
  const personalizacao = { ...personalizacaoInicial(produto), ...parcial };
  return { chave: chaveItem(produto, personalizacao), produto, quantidade, personalizacao };
};

// catálogo coerente
for (const prod of CARDAPIO_MOCK) {
  if (prod.precoPromocional !== undefined) assert.ok(prod.precoPromocional < prod.preco, 'promo menor que preço: ' + prod.nome);
  assert.ok(prod.imagem, 'produto sem imagem: ' + prod.nome);
}
assert.equal(new Set(CARDAPIO_MOCK.map((x) => x.id)).size, CARDAPIO_MOCK.length);
console.log('ok catalogo');

// preços
assert.equal(emPromocao(p(1)), false);
assert.equal(emPromocao(p(2)), true);
assert.equal(percentualDesconto(p(6)), 11); // 44,90 -> 39,90
assert.equal(precoUnitario(p(2), personalizacaoInicial(p(2))), 31.9);
assert.equal(precoCheio(p(2), personalizacaoInicial(p(2))), 34.9);
const batataG = { ...personalizacaoInicial(p(8)), tamanhoId: 'g', adicionaisIds: ['cheddar', 'bacon'] };
assert.equal(precoUnitario(p(8), batataG), 28.9); // 14,90 + 5 + 4 + 5
assert.deepEqual(descreverPersonalizacao(p(8), batataG), ['Tamanho: Grande', '+ Cheddar extra', '+ Bacon extra']);
assert.deepEqual(descreverPersonalizacao(p(9), personalizacaoInicial(p(9))), []);
console.log('ok precos e personalizacao');

// chave do carrinho: mesma escolha = mesmo item; escolha diferente = item distinto
assert.equal(chaveItem(p(1), personalizacaoInicial(p(1))), chaveItem(p(1), personalizacaoInicial(p(1))));
assert.notEqual(
  chaveItem(p(1), personalizacaoInicial(p(1))),
  chaveItem(p(1), { ...personalizacaoInicial(p(1)), adicionaisIds: ['bacon'] })
);
assert.equal(
  chaveItem(p(1), { ...personalizacaoInicial(p(1)), adicionaisIds: ['bacon', 'ovo'] }),
  chaveItem(p(1), { ...personalizacaoInicial(p(1)), adicionaisIds: ['ovo', 'bacon'] })
);
console.log('ok chave do item');

// resumo
let r = calcularResumo([], 'Entrega');
assert.equal(r.total, 0);
assert.equal(r.taxaEntrega, 0);
r = calcularResumo([item(1, 1)], 'Entrega'); // 28,90 + 6
assert.equal(r.subtotal, 28.9);
assert.equal(r.taxaEntrega, 6);
assert.equal(r.total, 34.9);
assert.equal(r.faltaParaFreteGratis, 41.1);
r = calcularResumo([item(1, 1)], 'Retirada');
assert.equal(r.taxaEntrega, 0);
assert.equal(r.total, 28.9);
assert.equal(r.faltaParaFreteGratis, 0);
r = calcularResumo([item(2, 1), item(6, 1)], 'Entrega'); // promos: 31,90 + 39,90 = 71,80 -> frete grátis
assert.equal(r.subtotal, 79.8);
assert.equal(r.desconto, 8);
assert.equal(r.taxaEntrega, 0);
assert.equal(r.total, 71.8);
// exatamente no limite (70,00 cobrado) já é grátis
r = calcularResumo([item(8, 1, { tamanhoId: 'g' })], 'Entrega');
assert.equal(r.taxaEntrega, 6);
console.log('ok resumo, desconto e frete gratis');

// pedir de novo
const pedido = {
  id: 1001,
  itens: [
    { produtoId: 8, nome: 'Batata Frita', precoUnitario: 19.9, quantidade: 2, observacao: 'bem sequinha', tamanhoId: 'g', adicionaisIds: ['cheddar', 'sumiu'], ingredientesRemovidos: [], detalhes: [] },
    { produtoId: 13, nome: 'Brownie com Sorvete', precoUnitario: 16.9, quantidade: 1, observacao: '', adicionaisIds: [], ingredientesRemovidos: [], detalhes: [] },
    { produtoId: 999, nome: 'Item antigo', precoUnitario: 10, quantidade: 1, observacao: '', adicionaisIds: [], ingredientesRemovidos: [], detalhes: [] },
  ],
} as unknown as Pedido;
const refeito = itensParaRefazer(pedido, CARDAPIO_MOCK);
assert.equal(refeito.itens.length, 1);
assert.deepEqual(refeito.ignorados, ['Brownie com Sorvete', 'Item antigo']);
assert.deepEqual(refeito.itens[0].personalizacao.adicionaisIds, ['cheddar']);
assert.equal(refeito.itens[0].personalizacao.tamanhoId, 'g');
assert.equal(refeito.itens[0].quantidade, 2);
console.log('ok pedir de novo');

// utilitários
assert.equal(normalizar('  Hambúrguer  '), 'hamburguer');
assert.equal(normalizar('Açaí'), 'acai');
assert.equal(primeiroNome('Pedro Germano'), 'Pedro');
assert.equal(primeiroNome(undefined), '');
assert.equal(saudacao(new Date(2026, 0, 1, 8)), 'Bom dia');
assert.equal(saudacao(new Date(2026, 0, 1, 15)), 'Boa tarde');
assert.equal(saudacao(new Date(2026, 0, 1, 21)), 'Boa noite');
assert.equal(pedidoFinalizado('Entregue'), true);
assert.equal(pedidoFinalizado('EmPreparo'), false);
console.log('ok utilitarios');
