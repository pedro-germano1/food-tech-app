import { Adicional, OpcaoTamanho, Produto } from '../types';

const BACON: Adicional = { id: 'bacon', nome: 'Bacon extra', preco: 5 };
const CHEDDAR: Adicional = { id: 'cheddar', nome: 'Cheddar extra', preco: 4 };
const OVO: Adicional = { id: 'ovo', nome: 'Ovo', preco: 3 };
const BLEND: Adicional = { id: 'blend', nome: 'Blend extra 120 g', preco: 9 };
const MOLHO: Adicional = { id: 'molho', nome: 'Molho da casa', preco: 2.5 };

const TAM_BATATA: OpcaoTamanho[] = [
  { id: 'm', nome: 'Média', acrescimo: 0 },
  { id: 'g', nome: 'Grande', acrescimo: 5 },
];
const TAM_BEBIDA: OpcaoTamanho[] = [
  { id: '350', nome: '350 ml', acrescimo: 0 },
  { id: '500', nome: '500 ml', acrescimo: 3 },
];

export const CARDAPIO_MOCK: Produto[] = [
  {
    id: 1, nome: 'Clássico da Casa',
    descricao: 'Blend bovino 160 g, queijo prato, alface, tomate e molho da casa no pão brioche.',
    preco: 28.9, categoria: 'Burgers', disponivel: true, imagem: 'classico', maisPedido: true,
    ingredientes: ['Queijo prato', 'Alface', 'Tomate', 'Molho da casa'],
    adicionais: [BACON, CHEDDAR, OVO, BLEND],
  },
  {
    id: 2, nome: 'Cheddar Bacon',
    descricao: 'Blend bovino 160 g, cheddar cremoso, bacon crocante e cebola caramelizada.',
    preco: 34.9, precoPromocional: 31.9, categoria: 'Burgers', disponivel: true, imagem: 'cheddar', maisPedido: true,
    ingredientes: ['Cheddar', 'Bacon', 'Cebola caramelizada'],
    adicionais: [BACON, OVO, BLEND, MOLHO],
  },
  {
    id: 3, nome: 'Duplo Brasa',
    descricao: 'Dois blends de 120 g, queijo prato duplo, picles e maionese defumada.',
    preco: 39.9, categoria: 'Burgers', disponivel: true, imagem: 'duplo', maisPedido: true,
    ingredientes: ['Queijo prato', 'Picles', 'Maionese defumada'],
    adicionais: [BACON, CHEDDAR, OVO],
  },
  {
    id: 4, nome: 'Frango Crocante',
    descricao: 'Filé de frango empanado, alface americana, tomate e maionese de ervas.',
    preco: 31.9, categoria: 'Burgers', disponivel: true, imagem: 'frango',
    ingredientes: ['Alface americana', 'Tomate', 'Maionese de ervas'],
    adicionais: [BACON, CHEDDAR, OVO],
  },
  {
    id: 5, nome: 'Veggie de Grão-de-Bico',
    descricao: 'Hambúrguer de grão-de-bico, rúcula, tomate seco e molho de iogurte. Opção vegetariana.',
    preco: 30.9, categoria: 'Burgers', disponivel: true, imagem: 'veggie', vegetariano: true,
    ingredientes: ['Rúcula', 'Tomate seco', 'Molho de iogurte'],
    adicionais: [CHEDDAR, OVO],
  },
  {
    id: 6, nome: 'Combo Clássico',
    descricao: 'Clássico da Casa + batata média + refrigerante lata.',
    preco: 44.9, precoPromocional: 39.9, categoria: 'Combos', disponivel: true, imagem: 'combo1', maisPedido: true,
    ingredientes: ['Queijo prato', 'Alface', 'Tomate', 'Molho da casa'],
    adicionais: [BACON, CHEDDAR],
  },
  {
    id: 7, nome: 'Combo Duplo Brasa',
    descricao: 'Duplo Brasa + batata grande + refrigerante lata.',
    preco: 56.9, precoPromocional: 49.9, categoria: 'Combos', disponivel: true, imagem: 'combo2',
    ingredientes: ['Queijo prato', 'Picles', 'Maionese defumada'],
    adicionais: [BACON, CHEDDAR],
  },
  {
    id: 8, nome: 'Batata Frita',
    descricao: 'Porção de batata frita sequinha com sal e páprica.',
    preco: 14.9, categoria: 'Acompanhamentos', disponivel: true, imagem: 'batata', vegetariano: true,
    tamanhos: TAM_BATATA,
    adicionais: [CHEDDAR, BACON],
  },
  {
    id: 9, nome: 'Onion Rings',
    descricao: 'Anéis de cebola empanados, servidos com molho barbecue.',
    preco: 17.9, categoria: 'Acompanhamentos', disponivel: true, imagem: 'rings', vegetariano: true,
  },
  {
    id: 10, nome: 'Refrigerante',
    descricao: 'Cola, guaraná ou limão. Informe o sabor nas observações.',
    preco: 6.5, categoria: 'Bebidas', disponivel: true, imagem: 'refri',
    tamanhos: TAM_BEBIDA,
  },
  {
    id: 11, nome: 'Suco Natural',
    descricao: 'Copo de 400 ml. Laranja ou limão com hortelã. Informe o sabor nas observações.',
    preco: 9.9, categoria: 'Bebidas', disponivel: true, imagem: 'suco', vegetariano: true,
  },
  {
    id: 12, nome: 'Milkshake de Chocolate',
    descricao: 'Sorvete de baunilha batido com calda de chocolate, 400 ml.',
    preco: 18.9, precoPromocional: 15.9, categoria: 'Sobremesas', disponivel: true, imagem: 'shake', vegetariano: true,
  },
  {
    id: 13, nome: 'Brownie com Sorvete',
    descricao: 'Brownie quente de chocolate com bola de sorvete de creme.',
    preco: 16.9, categoria: 'Sobremesas', disponivel: false, imagem: 'brownie', vegetariano: true,
  },
];
