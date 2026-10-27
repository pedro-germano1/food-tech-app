import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icone } from '../components/Icone';
import { ImagemProduto, PrecoProduto } from '../components/ProdutoCards';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { Aviso, Botao, BotaoIcone, EstadoVazio, Quantidade, Selo } from '../components/ui';
import { useCarrinho } from '../context/CarrinhoContext';
import { useFavoritos } from '../context/FavoritosContext';
import { emPromocao, percentualDesconto, personalizacaoInicial, precoUnitario } from '../domain/preco';
import { useCardapio } from '../hooks/useCardapio';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco, raio, sombra, tipo } from '../theme';
import { Personalizacao } from '../types';
import { moeda } from '../utils/formatar';

type Props = NativeStackScreenProps<AppStackParamList, 'Produto'>;

const MAX_OBS = 140;

export default function ProdutoScreen({ navigation, route }: Props) {
  const { produtoId, chaveEdicao } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { produtos, carregando, erro, carregar } = useCardapio();
  const { itens, adicionar, atualizarItem } = useCarrinho();
  const { ehFavorito, alternar } = useFavoritos();

  const produto = produtos.find((p) => p.id === produtoId);
  const itemEmEdicao = chaveEdicao ? itens.find((i) => i.chave === chaveEdicao) : undefined;

  const [pers, setPers] = useState<Personalizacao | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  // Define o estado inicial quando o produto (ou o item em edição) estiver disponível.
  useEffect(() => {
    if (!produto || pers) return;
    if (itemEmEdicao) {
      setPers(itemEmEdicao.personalizacao);
      setQuantidade(itemEmEdicao.quantidade);
    } else {
      setPers(personalizacaoInicial(produto));
    }
  }, [produto, itemEmEdicao, pers]);

  const unitario = useMemo(() => (produto && pers ? precoUnitario(produto, pers) : 0), [produto, pers]);
  const total = Math.round(unitario * quantidade * 100) / 100;

  function alternarLista(campo: 'adicionaisIds' | 'ingredientesRemovidos', valor: string) {
    setPers((atual) => {
      if (!atual) return atual;
      const lista = atual[campo];
      return { ...atual, [campo]: lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor] };
    });
  }

  function confirmar() {
    if (!produto || !pers || !produto.disponivel) return;
    const final = { ...pers, observacao: pers.observacao.trim() };
    if (chaveEdicao && itemEmEdicao) {
      atualizarItem(chaveEdicao, final, quantidade);
      toast.mostrar('Item atualizado');
    } else {
      adicionar(produto, quantidade, final);
      toast.mostrar(quantidade + 'x ' + produto.nome + ' no carrinho');
    }
    navigation.goBack();
  }

  const voltar = (
    <BotaoIcone icone="chevron-back" rotulo="Voltar" aoPressionar={() => navigation.goBack()} />
  );

  // ----- Carregando / erro / não encontrado -----
  if (!produto || !pers) {
    return (
      <SafeAreaView style={estilos.tela}>
        <StatusBar style="dark" />
        <View style={{ padding: espaco.lg }}>{voltar}</View>
        {carregando ? (
          <View style={{ padding: espaco.lg, gap: espaco.md }}>
            <Skeleton altura={220} arredondamento={raio.lg} />
            <Skeleton altura={24} largura="60%" />
            <Skeleton altura={14} />
            <Skeleton altura={14} largura="80%" />
          </View>
        ) : erro ? (
          <View style={{ padding: espaco.lg }}>
            <Aviso tipo="erro" texto={erro} />
            <Botao titulo="Tentar de novo" icone="refresh" aoPressionar={() => carregar()} />
          </View>
        ) : (
          <EstadoVazio
            icone="help-circle-outline"
            titulo="Produto não encontrado"
            texto="Ele pode ter saído do cardápio."
            acao={{ titulo: 'Voltar', aoPressionar: () => navigation.goBack() }}
          />
        )}
      </SafeAreaView>
    );
  }

  const favorito = ehFavorito(produto.id);
  const promo = emPromocao(produto);
  const temTamanhos = (produto.tamanhos?.length ?? 0) > 1;

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: espaco.xl }}>
          {/* Imagem principal */}
          <View style={estilos.hero}>
            <SafeAreaView edges={['top']}>
              <View style={estilos.heroBotoes}>
                {voltar}
                <BotaoIcone
                  icone={favorito ? 'heart' : 'heart-outline'}
                  cor={favorito ? cores.erro : cores.texto}
                  rotulo={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  aoPressionar={() =>
                    toast.mostrar(alternar(produto.id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info')
                  }
                />
              </View>
            </SafeAreaView>
            <ImagemProduto item={produto} estilo={estilos.heroImagem} imagemEstilo={{ width: '100%', height: '100%' }} />
          </View>

          <View style={estilos.conteudo}>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: espaco.sm }}>
              {promo ? <Selo texto={percentualDesconto(produto) + '% OFF'} /> : null}
              {produto.vegetariano ? <Selo texto="Vegetariano" variante="sucesso" icone="leaf" /> : null}
              {produto.maisPedido ? <Selo texto="Mais pedido" variante="neutro" icone="flame" /> : null}
            </View>
            <Text accessibilityRole="header" style={tipo.display}>
              {produto.nome}
            </Text>
            <View style={{ marginTop: espaco.xs }}>
              <PrecoProduto produto={produto} grande />
            </View>
            <Text style={[tipo.corpo, { color: cores.textoSuave, marginTop: espaco.md }]}>{produto.descricao}</Text>

            {!produto.disponivel ? (
              <View style={{ marginTop: espaco.lg }}>
                <Aviso texto="Este item está indisponível no momento." icone="time" />
              </View>
            ) : null}

            {/* Ingredientes (podem ser retirados) */}
            {produto.ingredientes && produto.ingredientes.length > 0 ? (
              <Secao titulo="Ingredientes" dica="Toque para retirar">
                <View style={estilos.ingredientes}>
                  {produto.ingredientes.map((nome) => {
                    const removido = pers.ingredientesRemovidos.includes(nome);
                    return (
                      <Pressable
                        key={nome}
                        onPress={() => alternarLista('ingredientesRemovidos', nome)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: !removido }}
                        accessibilityLabel={(removido ? 'Sem ' : 'Com ') + nome}
                        style={[estilos.ingrediente, removido && estilos.ingredienteRemovido]}
                      >
                        <Icone nome={removido ? 'close' : 'checkmark'} tamanho={14} cor={removido ? cores.erro : cores.primariaEscura} />
                        <Text style={[estilos.ingredienteTexto, removido && { color: cores.erro, textDecorationLine: 'line-through' }]}>{nome}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Secao>
            ) : null}

            {/* Tamanho */}
            {temTamanhos ? (
              <Secao titulo="Tamanho">
                {produto.tamanhos!.map((t) => {
                  const ativo = pers.tamanhoId === t.id;
                  return (
                    <Opcao
                      key={t.id}
                      tipoControle="radio"
                      ativo={ativo}
                      titulo={t.nome}
                      preco={t.acrescimo > 0 ? '+ ' + moeda(t.acrescimo) : 'Incluso'}
                      aoPressionar={() => setPers({ ...pers, tamanhoId: t.id })}
                    />
                  );
                })}
              </Secao>
            ) : null}

            {/* Adicionais */}
            {produto.adicionais && produto.adicionais.length > 0 ? (
              <Secao titulo="Adicionais" dica="Opcional">
                {produto.adicionais.map((a) => (
                  <Opcao
                    key={a.id}
                    tipoControle="checkbox"
                    ativo={pers.adicionaisIds.includes(a.id)}
                    titulo={a.nome}
                    preco={'+ ' + moeda(a.preco)}
                    aoPressionar={() => alternarLista('adicionaisIds', a.id)}
                  />
                ))}
              </Secao>
            ) : null}

            {/* Observações */}
            <Secao titulo="Observações" dica="Opcional">
              <TextInput
                value={pers.observacao}
                onChangeText={(t) => setPers({ ...pers, observacao: t.slice(0, MAX_OBS) })}
                placeholder="Ex.: ponto da carne, sabor do refrigerante…"
                placeholderTextColor={cores.textoSuave}
                accessibilityLabel="Observações para o preparo"
                multiline
                maxLength={MAX_OBS}
                style={estilos.observacao}
              />
              <Text style={[tipo.legenda, { textAlign: 'right', marginTop: 4 }]}>
                {pers.observacao.length}/{MAX_OBS}
              </Text>
            </Secao>
          </View>
        </ScrollView>

        {/* Barra fixa inferior */}
        <View style={[estilos.barra, { paddingBottom: Math.max(insets.bottom, espaco.md) }]}>
          <Quantidade
            valor={quantidade}
            nome={produto.nome}
            aoMudar={(d) => setQuantidade((q) => Math.min(20, Math.max(1, q + d)))}
          />
          <Botao
            titulo={(chaveEdicao ? 'Salvar — ' : 'Adicionar — ') + moeda(total)}
            rotuloAcessivel={(chaveEdicao ? 'Salvar alterações' : 'Adicionar ao carrinho') + ', total ' + moeda(total)}
            aoPressionar={confirmar}
            desabilitado={!produto.disponivel}
            estilo={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Secao({ titulo, dica, children }: { titulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: espaco.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: espaco.md }}>
        <Text accessibilityRole="header" style={tipo.subtitulo}>
          {titulo}
        </Text>
        {dica ? <Text style={tipo.legenda}>{dica}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Opcao({
  tipoControle,
  ativo,
  titulo,
  preco,
  aoPressionar,
}: {
  tipoControle: 'radio' | 'checkbox';
  ativo: boolean;
  titulo: string;
  preco: string;
  aoPressionar: () => void;
}) {
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole={tipoControle}
      accessibilityState={{ checked: ativo }}
      accessibilityLabel={titulo + ', ' + preco}
      style={[estilos.opcao, ativo && estilos.opcaoAtiva]}
    >
      <View style={[estilos.controle, tipoControle === 'radio' ? { borderRadius: 11 } : { borderRadius: 6 }, ativo && estilos.controleAtivo]}>
        {ativo ? <Icone nome="checkmark" cor={cores.branco} tamanho={14} /> : null}
      </View>
      <Text style={[tipo.corpoForte, { flex: 1 }]}>{titulo}</Text>
      <Text style={[tipo.legenda, { fontWeight: '700' }]}>{preco}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  hero: { backgroundColor: cores.superficie2, borderBottomLeftRadius: raio.xl, borderBottomRightRadius: raio.xl, paddingBottom: espaco.lg },
  heroBotoes: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: espaco.lg, paddingTop: espaco.sm },
  heroImagem: { width: 260, height: 220, aspectRatio: undefined, alignSelf: 'center', backgroundColor: 'transparent' },
  conteudo: { padding: espaco.lg, paddingTop: espaco.xl },
  ingredientes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  ingrediente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: raio.pill,
    backgroundColor: cores.superficie2,
  },
  ingredienteRemovido: { backgroundColor: cores.erroFundo },
  ingredienteTexto: { color: cores.primariaEscura, fontWeight: '600', fontSize: 14 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 54,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: cores.borda,
    marginBottom: espaco.sm,
  },
  opcaoAtiva: { borderColor: cores.primaria, backgroundColor: cores.superficie2 },
  controle: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
  },
  controleAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  observacao: {
    minHeight: 84,
    textAlignVertical: 'top',
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: raio.md,
    padding: espaco.md,
    fontSize: 15,
    color: cores.texto,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.lg,
    paddingTop: espaco.md,
    backgroundColor: cores.superficie,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    ...sombra,
  },
});
