import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icone } from '../components/Icone';
import { ImagemProduto } from '../components/ProdutoCards';
import { Botao, EstadoVazio, Quantidade } from '../components/ui';
import { config } from '../config';
import { useCarrinho } from '../context/CarrinhoContext';
import { calcularResumo, descreverPersonalizacao, emPromocao, precoCheio, precoUnitario } from '../domain/preco';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco, raio, sombra, tipo } from '../theme';
import { moeda } from '../utils/formatar';

type Props = NativeStackScreenProps<AppStackParamList, 'Carrinho'>;

export default function CarrinhoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { itens, alterarQuantidade, remover, limpar } = useCarrinho();

  // No carrinho a entrega é estimada; a modalidade definitiva é escolhida no checkout.
  const resumo = calcularResumo(itens, 'Entrega');
  const progresso = Math.min(1, (resumo.total - resumo.taxaEntrega) / config.FRETE_GRATIS_ACIMA);

  function confirmarLimpar() {
    Alert.alert('Esvaziar carrinho', 'Remover todos os itens do carrinho?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Esvaziar', style: 'destructive', onPress: limpar },
    ]);
  }

  if (itens.length === 0) {
    return (
      <SafeAreaView style={estilos.tela} edges={[]}>
        <EstadoVazio
          icone="bag-handle-outline"
          titulo="Seu carrinho está vazio"
          texto="Escolha um lanche no cardápio e ele aparece aqui."
          acao={{ titulo: 'Explorar cardápio', aoPressionar: () => navigation.navigate('Tabs', { screen: 'Cardapio', params: { filtro: 'Todos', ts: Date.now() } }) }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={[]}>
      <FlatList
        data={itens}
        keyExtractor={(i) => i.chave}
        contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}
        ListHeaderComponent={
          <View style={{ gap: espaco.md }}>
            <View style={estilos.cabecalho}>
              <Text style={tipo.legenda}>
                {resumo.quantidadeItens === 1 ? '1 item' : resumo.quantidadeItens + ' itens'}
              </Text>
              <Pressable onPress={confirmarLimpar} accessibilityRole="button" accessibilityLabel="Esvaziar carrinho" hitSlop={8}>
                <Text style={{ color: cores.erro, fontWeight: '700', fontSize: 14 }}>Esvaziar</Text>
              </Pressable>
            </View>

            <View style={estilos.frete}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
                <Icone nome="bicycle" cor={resumo.faltaParaFreteGratis > 0 ? cores.primaria : cores.sucesso} tamanho={20} />
                <Text style={[tipo.corpoForte, { flex: 1 }]}>
                  {resumo.faltaParaFreteGratis > 0
                    ? 'Faltam ' + moeda(resumo.faltaParaFreteGratis) + ' para frete grátis'
                    : 'Você ganhou frete grátis na entrega!'}
                </Text>
              </View>
              <View style={estilos.trilho} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progresso * 100) }}>
                <View style={[estilos.barra, { width: Math.round(progresso * 100) + '%', backgroundColor: progresso >= 1 ? cores.sucesso : cores.primaria }]} />
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const detalhes = descreverPersonalizacao(item.produto, item.personalizacao);
          const promo = emPromocao(item.produto);
          const linha = precoUnitario(item.produto, item.personalizacao) * item.quantidade;
          const cheio = precoCheio(item.produto, item.personalizacao) * item.quantidade;
          return (
            <View style={estilos.cartao}>
              <View style={{ flexDirection: 'row', gap: espaco.md }}>
                <ImagemProduto item={item.produto} estilo={estilos.foto} />
                <View style={{ flex: 1 }}>
                  <Text style={tipo.corpoForte} numberOfLines={2}>
                    {item.produto.nome}
                  </Text>
                  {detalhes.map((d) => (
                    <Text key={d} style={tipo.legenda} numberOfLines={1}>
                      {d}
                    </Text>
                  ))}
                  {item.personalizacao.observacao ? (
                    <Text style={[tipo.legenda, { fontStyle: 'italic' }]} numberOfLines={2}>
                      “{item.personalizacao.observacao}”
                    </Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={tipo.preco}>{moeda(linha)}</Text>
                  {promo ? <Text style={estilos.precoAntigo}>{moeda(cheio)}</Text> : null}
                </View>
              </View>

              <View style={estilos.acoes}>
                <View style={{ flexDirection: 'row', gap: espaco.lg }}>
                  <Pressable
                    onPress={() => navigation.navigate('Produto', { produtoId: item.produto.id, chaveEdicao: item.chave })}
                    accessibilityRole="button"
                    accessibilityLabel={'Editar ' + item.produto.nome}
                    hitSlop={8}
                    style={estilos.acao}
                  >
                    <Icone nome="create-outline" cor={cores.primaria} tamanho={18} />
                    <Text style={estilos.acaoTexto}>Editar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => remover(item.chave)}
                    accessibilityRole="button"
                    accessibilityLabel={'Remover ' + item.produto.nome}
                    hitSlop={8}
                    style={estilos.acao}
                  >
                    <Icone nome="trash-outline" cor={cores.erro} tamanho={18} />
                    <Text style={[estilos.acaoTexto, { color: cores.erro }]}>Remover</Text>
                  </Pressable>
                </View>
                <Quantidade compacto nome={item.produto.nome} valor={item.quantidade} aoMudar={(d) => alterarQuantidade(item.chave, d)} />
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={estilos.resumo}>
            <Text accessibilityRole="header" style={[tipo.subtitulo, { marginBottom: espaco.md }]}>
              Resumo do pedido
            </Text>
            <Linha rotulo="Subtotal" valor={moeda(resumo.subtotal)} />
            {resumo.desconto > 0 ? <Linha rotulo="Descontos (promoções)" valor={'− ' + moeda(resumo.desconto)} cor={cores.sucesso} /> : null}
            <Linha rotulo="Entrega (estimada)" valor={resumo.taxaEntrega === 0 ? 'Grátis' : moeda(resumo.taxaEntrega)} cor={resumo.taxaEntrega === 0 ? cores.sucesso : undefined} />
            <View style={estilos.divisor} />
            <Linha rotulo="Total" valor={moeda(resumo.total)} forte />
            <Text style={[tipo.legenda, { marginTop: espaco.sm }]}>
              Na retirada não há taxa de entrega. A modalidade é escolhida na próxima etapa.
            </Text>
          </View>
        }
      />

      <View style={[estilos.rodape, { paddingBottom: Math.max(insets.bottom, espaco.lg) }]}>
        <Botao titulo={'Continuar pedido • ' + moeda(resumo.total)} rotuloAcessivel={'Continuar pedido, total ' + moeda(resumo.total)} aoPressionar={() => navigation.navigate('Checkout')} />
      </View>
    </SafeAreaView>
  );
}

function Linha({ rotulo, valor, forte, cor }: { rotulo: string; valor: string; forte?: boolean; cor?: string }) {
  return (
    <View style={estilos.linha}>
      <Text style={forte ? tipo.subtitulo : tipo.legenda}>{rotulo}</Text>
      <Text style={[forte ? tipo.subtitulo : tipo.corpoForte, forte && { color: cores.primaria }, cor ? { color: cor } : null]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  frete: { backgroundColor: cores.superficie, borderRadius: raio.lg, padding: espaco.lg, borderWidth: 1, borderColor: cores.borda, gap: espaco.md },
  trilho: { height: 8, borderRadius: 4, backgroundColor: cores.superficie2, overflow: 'hidden' },
  barra: { height: 8, borderRadius: 4 },
  cartao: { backgroundColor: cores.superficie, borderRadius: raio.lg, padding: espaco.md, borderWidth: 1, borderColor: cores.borda, ...sombra },
  foto: { width: 72, height: 72, aspectRatio: undefined },
  precoAntigo: { fontSize: 12, color: cores.textoSuave, textDecorationLine: 'line-through' },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espaco.md,
    paddingTop: espaco.md,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 34 },
  acaoTexto: { color: cores.primaria, fontWeight: '700', fontSize: 14 },
  resumo: { backgroundColor: cores.superficie, borderRadius: raio.lg, padding: espaco.lg, borderWidth: 1, borderColor: cores.borda, marginTop: espaco.sm },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espaco.sm },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: espaco.sm },
  rodape: { padding: espaco.lg, backgroundColor: cores.superficie, borderTopWidth: 1, borderTopColor: cores.borda },
});
