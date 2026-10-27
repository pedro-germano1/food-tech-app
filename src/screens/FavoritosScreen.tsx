import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardProduto } from '../components/ProdutoCards';
import { Skeleton } from '../components/Skeleton';
import { EstadoVazio } from '../components/ui';
import { useFavoritos } from '../context/FavoritosContext';
import { useCardapio } from '../hooks/useCardapio';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco } from '../theme';
import { Produto } from '../types';

type Props = NativeStackScreenProps<AppStackParamList, 'Favoritos'>;

export default function FavoritosScreen({ navigation }: Props) {
  const { ids } = useFavoritos();
  const { produtos, carregando } = useCardapio();
  const favoritos = produtos.filter((p) => ids.includes(p.id));
  const abrir = useCallback((p: Produto) => navigation.navigate('Produto', { produtoId: p.id }), [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }} edges={['bottom']}>
      {carregando && produtos.length === 0 ? (
        <Skeleton altura={200} estilo={{ margin: espaco.lg, width: undefined }} />
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: espaco.md }}
          contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, flexGrow: 1 }}
          renderItem={({ item }) => <CardProduto produto={item} aoAbrir={abrir} />}
          ListEmptyComponent={
            <EstadoVazio
              icone="heart-outline"
              titulo="Nenhum favorito ainda"
              texto="Toque no coração na tela de um produto para guardá-lo aqui."
              acao={{ titulo: 'Ver cardápio', aoPressionar: () => navigation.navigate('Tabs', { screen: 'Cardapio', params: { filtro: 'Todos', ts: Date.now() } }) }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
