/**
 * Configurações centrais do aplicativo.
 *
 * USAR_MOCK = true  -> o app funciona sozinho, com uma API simulada (ótimo para demonstração).
 * USAR_MOCK = false -> o app consome a API REST (.NET) desenvolvida pelo grupo na Etapa 4.
 */
export const config = {
  NOME_LOJA: 'Food Tech',
  AUTOR: 'Pedro Germano',

  USAR_MOCK: true,

  // Endereço da API REST. No celular físico, use o IP da máquina que executa a API
  // (por exemplo, http://192.168.0.10:5000). "localhost" aponta para o próprio celular.
  API_URL: 'http://192.168.0.10:5000',

  TIMEOUT_MS: 8000,

  // Acompanhamento do pedido: de quanto em quanto tempo o app consulta o status.
  INTERVALO_POLLING_MS: 5000,

  // Sincronização da fila de pedidos feitos sem internet.
  INTERVALO_SYNC_MS: 15000,

  // Troca automática dos banners da Home.
  INTERVALO_BANNER_MS: 5000,

  // Valores usados apenas para EXIBIR uma estimativa. O total oficial vem sempre da API.
  TAXA_ENTREGA: 6,
  FRETE_GRATIS_ACIMA: 70,
  PREVISAO_ENTREGA_MIN: 35,
  PREVISAO_RETIRADA_MIN: 20,
};
