import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotaoCarrinho } from '../components/BotaoCarrinho';
import { Icone } from '../components/Icone';
import { CardProduto } from '../components/ProdutoCards';
import { SkeletonCardProduto } from '../components/Skeleton';
import { Aviso, Botao, EstadoVazio } from '../components/ui';
import { emPromocao, precoUnitario, personalizacaoInicial } from '../domain/preco';
import { useCardapio } from '../hooks/useCardapio';
import { AppStackParamList, FiltroCardapio, TabsParamList } from '../navigation/tipos';
import { cores, espaco, raio, tipo } from '../theme';
import { Produto } from '../types';
import { dataHora, normalizar } from '../utils/formatar';

const FILTROS: { id: FiltroCardapio; rotulo: string }[] = [
  { id: 'Todos', rotulo: 'Todos' },
  { id: 'Promocoes', rotulo: 'Promoções' },
  { id: 'Burgers', rotulo: 'Hambúrgueres' },
  { id: 'Combos', rotulo: 'Combos' },
  { id: 'Acompanhamentos', rotulo: 'Porções' },
  { id: 'Bebidas', rotulo: 'Bebidas' },
  { id: 'Sobremesas', rotulo: 'Sobremesas' },
];

type Ordem = 'padrao' | 'menor' | 'maior';
const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: 'padrao', rotulo: 'Padrão' },
  { id: 'menor', rotulo: 'Menor preço' },
  { id: 'maior', rotulo: 'Maior preço' },
];

export default function CardapioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<TabsParamList, 'Cardapio'>>();
  const { produtos, carregando, atualizando, erro, copiaDe, carregar } = useCardapio();

  const [filtro, setFiltro] = useState<FiltroCardapio>('Todos');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('padrao');
  const [soVeg, setSoVeg] = useState(false);
  const [focoBusca, setFocoBusca] = useState(false);

  // Vindo da Home (categoria ou busca): aplica o filtro recebido.
  const ts = route.params?.ts;
  useEffect(() => {
    if (!route.params) return;
    if (route.params.filtro) setFiltro(route.params.filtro);
    if (route.params.busca !== undefined) setBusca(route.params.busca);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ts]);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca);
    const lista = produtos.filter((p) => {
      const daCategoria = filtro === 'Todos' || (filtro === 'Promocoes' ? emPromocao(p) : p.categoria === filtro);
      const daBusca =
        termo === '' ||
        normalizar(p.nome).includes(termo) ||
        normalizar(p.categoria).includes(termo) ||
        normalizar(p.descricao).includes(termo);
      return daCategoria && daBusca && (!soVeg || p.vegetariano);
    });
    if (ordem === 'padrao') return lista;
    const valor = (p: Produto) => precoUnitario(p, personalizacaoInicial(p));
    return [...lista].sort((a, b) => (ordem === 'menor' ? valor(a) - valor(b) : valor(b) - valor(a)));
  }, [produtos, filtro, busca, ordem, soVeg]);

  // Transição suave ao trocar de categoria/filtro.
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [filtro, ordem, soVeg, busca, fade]);

  const abrir = useCallback((p: Produto) => navigation.navigate('Produto', { produtoId: p.id }), [navigation]);

  const temFiltroAtivo = filtro !== 'Todos' || busca !== '' || soVeg;
  function limparFiltros() {
    setFiltro('Todos');
    setBusca('');
    setSoVeg(false);
    setOrdem('padrao');
  }

  const cabecalho = (
    <View>
      {erro && produtos.length === 0 ? (
        <View style={{ marginBottom: espaco.md }}>
          <Aviso tipo="erro" texto={erro} />
          <Botao titulo="Tentar de novo" variante="secundario" icone="refresh" aoPressionar={() => carregar()} />
        </View>
      ) : null}
      {copiaDe ? <Aviso texto={'Sem conexão. Mostrando o cardápio salvo em ' + dataHora(copiaDe) + '.'} /> : null}
      <Text style={estilos.contagem} accessibilityLiveRegion="polite">
        {filtrados.length === 1 ? '1 item' : filtrados.length + ' itens'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <View style={estilos.topo}>
        <View style={estilos.linhaTitulo}>
          <Text accessibilityRole="header" style={tipo.display}>
            Cardápio
          </Text>
          <BotaoCarrinho />
        </View>

        <View style={[estilos.busca, focoBusca && { borderColor: cores.primaria }]}>
          <Icone nome="search" cor={focoBusca ? cores.primaria : cores.textoSuave} tamanho={20} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            onFocus={() => setFocoBusca(true)}
            onBlur={() => setFocoBusca(false)}
            placeholder="Buscar por nome ou categoria"
            placeholderTextColor={cores.textoSuave}
            accessibilityLabel="Buscar no cardápio"
            returnKeyType="search"
            autoCorrect={false}
            style={estilos.buscaCampo}
          />
          {busca.length > 0 ? (
            <Pressable onPress={() => setBusca('')} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={10}>
              <Icone nome="close-circle" cor={cores.textoSuave} tamanho={20} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips} keyboardShouldPersistTaps="handled">
          {FILTROS.map((f) => {
            const ativo = filtro === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFiltro(f.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={'Categoria ' + f.rotulo}
                style={[estilos.chip, ativo && estilos.chipAtivo]}
              >
                {f.id === 'Promocoes' ? <Icone nome="pricetag" cor={ativo ? cores.textoNaPrimaria : cores.alerta} tamanho={14} /> : null}
                <Text style={[estilos.chipTexto, ativo && { color: cores.textoNaPrimaria }]}>{f.rotulo}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => setSoVeg((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: soVeg }}
            accessibilityLabel="Somente vegetarianos"
            style={[estilos.chipFiltro, soVeg && estilos.chipFiltroAtivo]}
          >
            <Icone nome="leaf" cor={soVeg ? cores.sucesso : cores.textoSuave} tamanho={14} />
            <Text style={[estilos.chipFiltroTexto, soVeg && { color: cores.sucesso }]}>Vegetarianos</Text>
          </Pressable>
          {ORDENS.map((o) => {
            const ativo = ordem === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setOrdem(o.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={'Ordenar: ' + o.rotulo}
                style={[estilos.chipFiltro, ativo && estilos.chipFiltroAtivo, ativo && { borderColor: cores.primaria, backgroundColor: cores.superficie2 }]}
              >
                {o.id !== 'padrao' ? <Icone nome={o.id === 'menor' ? 'arrow-down' : 'arrow-up'} cor={ativo ? cores.primariaEscura : cores.textoSuave} tamanho={14} /> : null}
                <Text style={[estilos.chipFiltroTexto, ativo && { color: cores.primariaEscura }]}>{o.rotulo}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {carregando && produtos.length === 0 ? (
        <View style={estilos.grade}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: '50%', padding: 6 }}>
              <SkeletonCardProduto />
            </View>
          ))}
        </View>
      ) : (
        <Animated.View style={[estilos.corpo, { opacity: fade }]}>
          <FlatList
            data={filtrados}
            keyExtractor={(p) => String(p.id)}
            numColumns={2}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={cabecalho}
            columnWrapperStyle={{ gap: espaco.md }}
            contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, paddingBottom: espaco.xxxl, flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} colors={[cores.primaria]} />}
            renderItem={({ item }) => <CardProduto produto={item} aoAbrir={abrir} />}
            ListEmptyComponent={
              erro && produtos.length === 0 ? null : (
                <EstadoVazio
                  icone="fast-food-outline"
                  titulo="Nenhum item encontrado"
                  texto="Nada combina com esses filtros. Que tal ver o cardápio completo?"
                  acao={temFiltroAtivo ? { titulo: 'Limpar filtros', aoPressionar: limparFiltros } : undefined}
                />
              )
            }
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  // Fundo branco: a faixa da barra de status continua o cabeçalho; a lista tem o próprio fundo.
  tela: { flex: 1, backgroundColor: cores.superficie },
  corpo: { flex: 1, backgroundColor: cores.fundo },
  topo: { backgroundColor: cores.superficie, paddingTop: espaco.sm, borderBottomWidth: 1, borderBottomColor: cores.borda },
  linhaTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: espaco.lg },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    marginHorizontal: espaco.lg,
    marginTop: espaco.md,
    minHeight: 48,
    paddingHorizontal: espaco.lg,
    backgroundColor: cores.fundo,
    borderRadius: raio.pill,
    borderWidth: 1.5,
    borderColor: cores.borda,
  },
  buscaCampo: { flex: 1, fontSize: 15, color: cores.texto, paddingVertical: 10 },
  chips: { paddingHorizontal: espaco.lg, paddingTop: espaco.md, gap: espaco.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: raio.pill,
    backgroundColor: cores.superficie2,
  },
  chipAtivo: { backgroundColor: cores.primaria },
  chipTexto: { color: cores.primariaEscura, fontWeight: '700', fontSize: 14 },
  chipFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: raio.pill,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    marginBottom: espaco.md,
  },
  chipFiltroAtivo: { borderColor: cores.sucesso, backgroundColor: cores.sucessoFundo },
  chipFiltroTexto: { color: cores.textoSuave, fontWeight: '600', fontSize: 13 },
  contagem: { ...tipo.legenda, marginBottom: espaco.md },
  grade: {
    backgroundColor: cores.fundo, flexDirection: 'row', flexWrap: 'wrap', padding: espaco.lg - 6 },
});
