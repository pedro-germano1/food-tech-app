import React, { useCallback } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonteImagem } from '../assets/imagens';
import { emPromocao, percentualDesconto, personalizacaoInicial } from '../domain/preco';
import { useCarrinho } from '../context/CarrinhoContext';
import { cores, espaco, raio, sombra, tipo } from '../theme';
import { Produto } from '../types';
import { moeda } from '../utils/formatar';
import { Icone } from './Icone';
import { PressableScale } from './PressableScale';
import { useToast } from './Toast';
import { Selo } from './ui';

/** Foto do produto sobre um fundo azul claro, sempre com a mesma proporção. */
export function ImagemProduto({
  item,
  estilo,
  imagemEstilo,
}: {
  item: { nome: string; imagem?: string; imagemUrl?: string };
  estilo?: StyleProp<ViewStyle>;
  imagemEstilo?: StyleProp<ImageStyle>;
}) {
  return (
    <View style={[estilos.imagemFundo, estilo]}>
      <Image
        source={fonteImagem(item)}
        style={[estilos.imagem, imagemEstilo]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessibilityLabel={item.nome}
      />
    </View>
  );
}

/** Adiciona 1 unidade com as opções padrão e avisa com um toast. */
export function useAdicionarRapido() {
  const { adicionar } = useCarrinho();
  const toast = useToast();
  return useCallback(
    (p: Produto) => {
      adicionar(p, 1, personalizacaoInicial(p));
      toast.mostrar(p.nome + ' adicionado ao carrinho');
    },
    [adicionar, toast]
  );
}

export function PrecoProduto({ produto, grande = false }: { produto: Produto; grande?: boolean }) {
  const promo = emPromocao(produto);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
      <Text style={[tipo.preco, grande && { fontSize: 22, lineHeight: 28 }]}>
        {moeda(promo ? (produto.precoPromocional as number) : produto.preco)}
      </Text>
      {promo ? (
        <Text style={estilos.precoAntigo} accessibilityLabel={'de ' + moeda(produto.preco)}>
          {moeda(produto.preco)}
        </Text>
      ) : null}
    </View>
  );
}

/** Card vertical usado em grades e carrosséis. */
export function CardProduto({
  produto,
  aoAbrir,
  largura,
  estilo,
}: {
  produto: Produto;
  aoAbrir: (p: Produto) => void;
  largura?: number;
  estilo?: StyleProp<ViewStyle>;
}) {
  const adicionarRapido = useAdicionarRapido();
  const promo = emPromocao(produto);
  const indisponivel = !produto.disponivel;

  return (
    <PressableScale
      onPress={() => aoAbrir(produto)}
      accessibilityRole="button"
      accessibilityLabel={
        produto.nome + ', ' + moeda(promo ? (produto.precoPromocional as number) : produto.preco) + (indisponivel ? ', indisponível' : '')
      }
      estilo={[estilos.card, largura ? { width: largura } : { flex: 1 }, estilo]}
    >
      <View>
        <ImagemProduto item={produto} estilo={indisponivel ? { opacity: 0.45 } : undefined} />
        <View style={estilos.selos}>
          {promo ? <Selo texto={'-' + percentualDesconto(produto) + '%'} /> : null}
          {produto.vegetariano ? <Selo texto="Veg" variante="sucesso" icone="leaf" /> : null}
        </View>
        {indisponivel ? (
          <View style={estilos.indisponivel}>
            <Text style={estilos.indisponivelTexto}>Indisponível</Text>
          </View>
        ) : null}
      </View>

      <Text style={estilos.nome} numberOfLines={1}>
        {produto.nome}
      </Text>
      <Text style={estilos.descricao} numberOfLines={2}>
        {produto.descricao}
      </Text>

      <View style={estilos.rodape}>
        <View style={{ flex: 1 }}>
          <PrecoProduto produto={produto} />
        </View>
        {!indisponivel ? (
          <PressableScale
            onPress={() => adicionarRapido(produto)}
            accessibilityRole="button"
            accessibilityLabel={'Adicionar ' + produto.nome + ' ao carrinho'}
            hitSlop={8}
            escala={0.88}
            estilo={estilos.botaoAdd}
          >
            <Icone nome="add" cor={cores.textoNaPrimaria} tamanho={22} />
          </PressableScale>
        ) : null}
      </View>
    </PressableScale>
  );
}

const estilos = StyleSheet.create({
  imagemFundo: {
    backgroundColor: cores.superficie2,
    borderRadius: raio.md,
    aspectRatio: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagem: { width: '88%', height: '88%' },
  card: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espaco.sm,
    borderWidth: 1,
    borderColor: cores.borda,
    ...sombra,
  },
  selos: { position: 'absolute', top: 8, left: 8, gap: 4 },
  indisponivel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indisponivelTexto: {
    backgroundColor: cores.marca,
    color: cores.branco,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: raio.pill,
    overflow: 'hidden',
  },
  nome: { ...tipo.corpoForte, fontWeight: '800', marginTop: espaco.sm, paddingHorizontal: 4 },
  descricao: { ...tipo.legenda, marginTop: 2, paddingHorizontal: 4, minHeight: 36 },
  rodape: { flexDirection: 'row', alignItems: 'center', marginTop: espaco.sm, paddingHorizontal: 4, paddingBottom: 2 },
  precoAntigo: { fontSize: 12, color: cores.textoSuave, textDecorationLine: 'line-through' },
  botaoAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
