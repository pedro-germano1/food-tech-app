import { NavigatorScreenParams } from '@react-navigation/native';
import { Categoria } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Registro: undefined;
};

/** Filtro do cardápio: uma categoria, as promoções ou tudo. */
export type FiltroCardapio = 'Todos' | 'Promocoes' | Categoria;

export type TabsParamList = {
  Inicio: undefined;
  /** `ts` muda a cada navegação para o filtro ser reaplicado mesmo repetindo o valor. */
  Cardapio: { filtro?: FiltroCardapio; busca?: string; ts?: number } | undefined;
  Pedidos: undefined;
  Perfil: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  /** `chaveEdicao`: quando vem do carrinho, edita aquele item em vez de criar outro. */
  Produto: { produtoId: number; chaveEdicao?: string };
  Carrinho: undefined;
  Checkout: undefined;
  Acompanhamento: { pedidoId: number };
  Enderecos: { escolher?: boolean } | undefined;
  EnderecoForm: { id?: string } | undefined;
  Favoritos: undefined;
};
