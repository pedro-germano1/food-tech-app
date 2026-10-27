import assert from 'node:assert/strict';
import { api } from '../src/services';
import { definirOfflineSimulado } from '../src/services/apiMock';
import { definirToken } from '../src/services/tokenAtual';
import { enfileirarPedido, processarFila, lerFila, obterCardapio } from '../src/services/sincronizacao';
import { ApiError } from '../src/services/erros';
import { NovoPedido } from '../src/types';

(async () => {
  // login
  await assert.rejects(api.login('demo@foodtech.com', 'errada'), (e: any) => e instanceof ApiError);
  const s = await api.login('demo@foodtech.com', '123456');
  definirToken(s.token);
  console.log('ok login');

  // cardápio online -> cache -> offline usa cache
  const on = await obterCardapio();
  assert.equal(on.origem, 'rede');
  definirOfflineSimulado(true);
  const off = await obterCardapio();
  assert.equal(off.origem, 'cache');
  assert.equal(off.dados.length, on.dados.length);
  console.log('ok cache offline');

  const classico = on.dados.find((p) => p.id === 1)!;
  const novo: NovoPedido = {
    chaveIdempotencia: 'K1',
    modalidade: 'Entrega',
    itens: [{ produtoId: classico.id, quantidade: 2, observacao: '', adicionaisIds: [], ingredientesRemovidos: [] }],
    enderecoEntrega: 'Rua das Acácias, 120 - Centro',
    formaPagamento: 'Pix',
  };

  // pedido offline vai pra fila
  await assert.rejects(api.criarPedido(novo), (e: any) => e.codigo === 'REDE');
  await enfileirarPedido(s.usuario.id, novo, { total: 63.8, quantidadeItens: 2 });
  let r = await processarFila(s.usuario.id);
  assert.equal(r.enviados.length, 0);
  assert.equal(r.restantes.length, 1);
  definirOfflineSimulado(false);
  r = await processarFila(s.usuario.id);
  assert.equal(r.enviados.length, 1);
  assert.equal(r.restantes.length, 0);
  // 2 x 28,90 = 57,80 + taxa 6,00 = 63,80
  assert.equal(r.enviados[0].subtotal, 57.8);
  assert.equal(r.enviados[0].taxaEntrega, 6);
  assert.equal(r.enviados[0].total, 63.8);
  assert.equal(r.enviados[0].modalidade, 'Entrega');
  console.log('ok fila offline -> envio, total servidor', r.enviados[0].total);

  // idempotência
  const again = await api.criarPedido(novo);
  assert.equal(again.id, r.enviados[0].id);
  assert.equal((await api.listarPedidos()).length, 1);
  console.log('ok idempotencia');

  // servidor recalcula: promoção + tamanho + adicional + retirada sem taxa
  const batata = on.dados.find((p) => p.id === 8)!; // 14,90, tamanho G +5, cheddar +4
  const cheddarBacon = on.dados.find((p) => p.id === 2)!; // 34,90 promo 31,90, bacon +5
  const personalizado = await api.criarPedido({
    chaveIdempotencia: 'K3',
    modalidade: 'Retirada',
    itens: [
      { produtoId: batata.id, quantidade: 1, observacao: '', tamanhoId: 'g', adicionaisIds: ['cheddar'], ingredientesRemovidos: [] },
      { produtoId: cheddarBacon.id, quantidade: 1, observacao: 'sem cebola, por favor', adicionaisIds: ['bacon', 'inexistente'], ingredientesRemovidos: ['Cebola caramelizada', 'xyz'] },
    ],
    enderecoEntrega: 'endereço ignorado na retirada',
    formaPagamento: 'Dinheiro',
  });
  assert.equal(personalizado.itens[0].precoUnitario, 23.9); // 14,90 + 5 + 4
  assert.equal(personalizado.itens[1].precoUnitario, 36.9); // 31,90 + 5 (adicional inexistente ignorado)
  assert.deepEqual(personalizado.itens[1].ingredientesRemovidos, ['Cebola caramelizada']);
  assert.ok(personalizado.itens[0].detalhes.includes('Tamanho: Grande'));
  assert.ok(personalizado.itens[1].detalhes.includes('+ Bacon extra'));
  assert.equal(personalizado.subtotal, 23.9 + 39.9 + 0); // cheio: 23,90 + (34,90+5)
  assert.equal(personalizado.desconto, 3); // economia da promoção do Cheddar Bacon
  assert.equal(personalizado.taxaEntrega, 0);
  assert.equal(personalizado.enderecoEntrega, '');
  assert.equal(personalizado.total, 60.8);
  console.log('ok preco recalculado pelo servidor, retirada sem taxa e sem endereço');

  // frete grátis acima de 70
  const grande = await api.criarPedido({
    chaveIdempotencia: 'K4',
    modalidade: 'Entrega',
    itens: [{ produtoId: 3, quantidade: 2, observacao: '', adicionaisIds: [], ingredientesRemovidos: [] }], // 79,80
    enderecoEntrega: 'Av. Brasil, 10 - Centro',
    formaPagamento: 'Cartao',
  });
  assert.equal(grande.taxaEntrega, 0);
  assert.equal(grande.total, 79.8);
  console.log('ok frete gratis');

  // validações definitivas
  const base = { modalidade: 'Entrega' as const, formaPagamento: 'Pix' as const, enderecoEntrega: 'Rua das Acácias, 120' };
  const item = { produtoId: 1, quantidade: 1, observacao: '', adicionaisIds: [], ingredientesRemovidos: [] };
  await assert.rejects(api.criarPedido({ ...base, chaveIdempotencia: 'V1', itens: [] }), (e: any) => e.status === 400);
  await assert.rejects(api.criarPedido({ ...base, chaveIdempotencia: 'V2', itens: [{ ...item, produtoId: 13 }] }), (e: any) => e.status === 400); // indisponível
  await assert.rejects(api.criarPedido({ ...base, chaveIdempotencia: 'V3', itens: [{ ...item, quantidade: 0 }] }), (e: any) => e.status === 400);
  await assert.rejects(api.criarPedido({ ...base, chaveIdempotencia: 'V4', enderecoEntrega: 'x', itens: [item] }), (e: any) => e.status === 400);
  console.log('ok validacoes 4xx');

  // validação definitiva sai da fila
  await enfileirarPedido(s.usuario.id, { ...base, chaveIdempotencia: 'K2', enderecoEntrega: 'x', itens: [item] }, { total: 1, quantidadeItens: 1 });
  r = await processarFila(s.usuario.id);
  assert.equal(r.rejeitados.length, 1);
  assert.equal((await lerFila(s.usuario.id)).length, 0);
  console.log('ok rejeicao 4xx');

  // 401 sem token
  definirToken(null);
  await assert.rejects(api.listarPedidos(), (e: any) => e.status === 401);
  console.log('ok 401');

  // status por tempo (pedido recém-criado)
  definirToken(s.token);
  const p = (await api.listarPedidos())[0];
  assert.ok(['Recebido', 'Confirmado'].includes(p.status));
  console.log('status', p.status, 'ok');
})().catch((e) => {
  console.error('FALHOU', e);
  process.exit(1);
});
