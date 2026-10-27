import { DadosRegistro, NovoPedido, Pedido, Produto, SessaoAuth } from '../types';

/**
 * Contrato da API consumida pelo aplicativo.
 * A implementação real (HTTP) e a simulada (mock) respeitam a mesma interface,
 * então as telas não sabem de onde os dados vêm.
 *
 * Endpoints REST correspondentes (API .NET do grupo):
 *   POST /api/auth/login        -> login
 *   POST /api/auth/registro     -> registrar
 *   GET  /api/produtos          -> listarProdutos
 *   POST /api/pedidos           -> criarPedido
 *   GET  /api/pedidos           -> listarPedidos  (somente pedidos do usuário autenticado)
 *   GET  /api/pedidos/{id}      -> obterPedido
 */
export interface Api {
  login(email: string, senha: string): Promise<SessaoAuth>;
  registrar(dados: DadosRegistro): Promise<SessaoAuth>;
  listarProdutos(): Promise<Produto[]>;
  criarPedido(novo: NovoPedido): Promise<Pedido>;
  listarPedidos(): Promise<Pedido[]>;
  obterPedido(id: number): Promise<Pedido>;
}
