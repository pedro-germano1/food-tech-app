import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonteImagem } from '../assets/imagens';
import { BotaoCarrinho } from '../components/BotaoCarrinho';
import { Icone, NomeIcone } from '../components/Icone';
import { PressableScale } from '../components/PressableScale';
import { CardProduto, ImagemProduto, PrecoProduto, useAdicionarRapido } from '../components/ProdutoCards';
import { SkeletonCardProduto } from '../components/Skeleton';
import { Aviso, Botao, EstadoVazio, Selo, TituloSecao } from '../components/ui';
import { config } from '../config';
import { useAuth } from '../context/AuthContext';
import { textoEndereco, useEnderecos } from '../context/EnderecosContext';
import { emPromocao, percentualDesconto } from '../domain/preco';
import { useCardapio } from '../hooks/useCardapio';
import { AppStackParamList, FiltroCardapio } from '../navigation/tipos';
import { cores, espaco, raio, sombra, tipo } from '../theme';
import { Produto } from '../types';
import { dataHora, moeda, normalizar, primeiroNome, saudacao } from '../utils/formatar';

type Nav = NativeStackNavigationProp<AppStackParamList>;

interface Atalho {
  rotulo: string;
  filtro: FiltroCardapio;
  imagem?: string;
  icone?: NomeIcone;
}

const ATALHOS: Atalho[] = [
  { rotulo: 'Hambúrgueres', filtro: 'Burgers', imagem: 'classico' },
  { rotulo: 'Combos', filtro: 'Combos', imagem: 'combo1' },
  { rotulo: 'Porções', filtro: 'Acompanhamentos', imagem: 'batata' },
  { rotulo: 'Bebidas', filtro: 'Bebidas', imagem: 'refri' },
  { rotulo: 'Sobremesas', filtro: 'Sobremesas', imagem: 'shake' },
  { rotulo: 'Promoções', filtro: 'Promocoes', icone: 'pricetag' },
];

type Slide = { id: string; tipo: 'intro' } | { id: string; tipo: 'promo'; produto: Produto };

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { usuario } = useAuth();
  const { selecionado: endereco } = useEnderecos();
  const { produtos, carregando, atualizando, erro, copiaDe, carregar } = useCardapio();
  const adicionarRapido = useAdicionarRapido();
  const { width } = useWindowDimensions();

  const [busca, setBusca] = useState('');
  const [focoBusca, setFocoBusca] = useState(false);

  const larguraBanner = width - espaco.lg * 2;
  const buscando = busca.trim().length > 0;

  const abrirProduto = useCallback(
    (p: Produto) => navigation.navigate('Produto', { produtoId: p.id }),
    [navigation]
  );

  function irParaCardapio(filtro: FiltroCardapio) {
    navigation.navigate('Tabs', { screen: 'Cardapio', params: { filtro, ts: Date.now() } });
  }

  const promocoes = useMemo(() => produtos.filter((p) => p.disponivel && emPromocao(p)), [produtos]);
  const maisPedidos = useMemo(() => produtos.filter((p) => p.disponivel && p.maisPedido), [produtos]);

  const resultados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return [];
    return produtos.filter(
      (p) =>
        normalizar(p.nome).includes(termo) ||
        normalizar(p.categoria).includes(termo) ||
        normalizar(p.descricao).includes(termo)
    );
  }, [produtos, busca]);

  const slides: Slide[] = useMemo(
    () => [{ id: 'intro', tipo: 'intro' }, ...promocoes.slice(0, 3).map((p): Slide => ({ id: 'p' + p.id, tipo: 'promo', produto: p }))],
    [promocoes]
  );

  // ---------- Carrossel de banners ----------
  const [indice, setIndice] = useState(0);
  const listaBanner = useRef<FlatList<Slide>>(null);
  const pausado = useRef(false);

  useEffect(() => {
    if (slides.length < 2 || buscando) return;
    const t = setInterval(() => {
      if (pausado.current) return;
      setIndice((atual) => {
        const prox = (atual + 1) % slides.length;
        listaBanner.current?.scrollToOffset({ offset: prox * (larguraBanner + espaco.md), animated: true });
        return prox;
      });
    }, config.INTERVALO_BANNER_MS);
    return () => clearInterval(t);
  }, [slides.length, larguraBanner, buscando]);

  function aoFimDoArraste(e: NativeSyntheticEvent<NativeScrollEvent>) {
    pausado.current = false;
    setIndice(Math.round(e.nativeEvent.contentOffset.x / (larguraBanner + espaco.md)));
  }

  // ---------- Cabeçalho ----------
  const inicial = usuario ? usuario.nome.trim().charAt(0).toUpperCase() : '?';

  return (
    <View style={estilos.tela}>
      <StatusBar style="light" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} tintColor={cores.branco} colors={[cores.primaria]} />
        }
        contentContainerStyle={{ paddingBottom: espaco.xxxl }}
      >
        <SafeAreaView edges={['top']} style={estilos.topo}>
          <View style={estilos.linhaTopo}>
            <Image
              source={require('../../assets/logo.png')}
              style={estilos.logo}
              resizeMode="contain"
              accessibilityLabel={'Logotipo ' + config.NOME_LOJA}
            />
            <View style={{ flex: 1 }} />
            <BotaoCarrinho fundo="rgba(255,255,255,0.12)" cor={cores.branco} />
            <PressableScale
              onPress={() => navigation.navigate('Tabs', { screen: 'Perfil' })}
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil"
              estilo={estilos.avatar}
            >
              <Text style={estilos.avatarTexto}>{inicial}</Text>
            </PressableScale>
          </View>

          <Text style={estilos.saudacao} numberOfLines={1}>
            {saudacao()}
            {usuario ? ', ' + primeiroNome(usuario.nome) : ''}!
          </Text>
          <Text style={estilos.subSaudacao}>Peça rápido e acompanhe tudo pelo app.</Text>

          <PressableScale
            onPress={() => navigation.navigate('Enderecos', { escolher: true })}
            accessibilityRole="button"
            accessibilityLabel={endereco ? 'Entregar em ' + textoEndereco(endereco) + '. Toque para trocar.' : 'Adicionar endereço de entrega'}
            estilo={estilos.chipEndereco}
          >
            <Icone nome="location" cor={cores.destaque} tamanho={16} />
            <Text style={estilos.chipTexto} numberOfLines={1}>
              {endereco ? 'Entregar em ' + textoEndereco(endereco) : 'Adicionar endereço de entrega'}
            </Text>
            <Icone nome="chevron-down" cor={cores.azulClaro} tamanho={16} />
          </PressableScale>
        </SafeAreaView>

        {/* Barra de pesquisa sobreposta ao topo */}
        <View style={[estilos.busca, focoBusca && estilos.buscaFoco]}>
          <Icone nome="search" cor={focoBusca ? cores.primaria : cores.textoSuave} tamanho={20} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            onFocus={() => setFocoBusca(true)}
            onBlur={() => setFocoBusca(false)}
            placeholder="O que você está com vontade de comer?"
            placeholderTextColor={cores.textoSuave}
            accessibilityLabel="Buscar produtos por nome ou categoria"
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

        <View style={{ paddingHorizontal: espaco.lg }}>
          {erro && produtos.length === 0 ? (
            <View style={{ marginTop: espaco.xl }}>
              <Aviso tipo="erro" texto={erro} />
              <Botao titulo="Tentar de novo" variante="secundario" icone="refresh" aoPressionar={() => carregar()} />
            </View>
          ) : null}
          {copiaDe ? (
            <View style={{ marginTop: espaco.lg }}>
              <Aviso texto={'Sem conexão. Mostrando o cardápio salvo em ' + dataHora(copiaDe) + '.'} />
            </View>
          ) : null}
        </View>

        {buscando ? (
          // ---------- Resultados da busca ----------
          <View style={{ paddingHorizontal: espaco.lg, marginTop: espaco.xl }}>
            <Text style={tipo.legenda} accessibilityLiveRegion="polite">
              {resultados.length === 1 ? '1 resultado' : resultados.length + ' resultados'} para “{busca.trim()}”
            </Text>
            {resultados.length === 0 ? (
              <EstadoVazio
                icone="search"
                titulo="Nada por aqui"
                texto="Tente outro nome ou uma categoria, como “combo” ou “bebida”."
              />
            ) : (
              <View style={estilos.grade}>
                {resultados.map((p) => (
                  <View key={p.id} style={estilos.celulaGrade}>
                    <CardProduto produto={p} aoAbrir={abrirProduto} />
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ---------- Banners ---------- */}
            <View style={{ marginTop: espaco.xl }}>
              <FlatList
                ref={listaBanner}
                data={slides}
                keyExtractor={(s) => s.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={larguraBanner + espaco.md}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: espaco.lg, gap: espaco.md }}
                onScrollBeginDrag={() => {
                  pausado.current = true;
                }}
                onMomentumScrollEnd={aoFimDoArraste}
                renderItem={({ item }) =>
                  item.tipo === 'intro' ? (
                    <BannerIntro largura={larguraBanner} aoPressionar={() => irParaCardapio('Promocoes')} temOfertas={promocoes.length > 0} />
                  ) : (
                    <BannerPromo largura={larguraBanner} produto={item.produto} aoPressionar={() => abrirProduto(item.produto)} />
                  )
                }
              />
              {slides.length > 1 ? (
                <View style={estilos.pontos} accessibilityElementsHidden importantForAccessibility="no">
                  {slides.map((s, i) => (
                    <View key={s.id} style={[estilos.ponto, i === indice && estilos.pontoAtivo]} />
                  ))}
                </View>
              ) : null}
            </View>

            {/* ---------- Categorias ---------- */}
            <View style={{ marginTop: espaco.xl }}>
              <TituloSecao titulo="Categorias" estilo={{ paddingHorizontal: espaco.lg }} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: espaco.lg, paddingTop: espaco.md, gap: espaco.md }}
              >
                {ATALHOS.map((a) => (
                  <PressableScale
                    key={a.filtro}
                    onPress={() => irParaCardapio(a.filtro)}
                    accessibilityRole="button"
                    accessibilityLabel={'Categoria ' + a.rotulo}
                    estilo={estilos.atalho}
                  >
                    <View style={[estilos.atalhoIcone, a.filtro === 'Promocoes' && { backgroundColor: cores.destaque }]}>
                      {a.imagem ? (
                        <Image source={fonteImagem({ imagem: a.imagem })} style={estilos.atalhoImagem} resizeMode="contain" />
                      ) : (
                        <Icone nome={a.icone as NomeIcone} cor={cores.textoNoDestaque} tamanho={30} />
                      )}
                    </View>
                    <Text style={estilos.atalhoRotulo} numberOfLines={1}>
                      {a.rotulo}
                    </Text>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>

            {/* ---------- Os mais pedidos ---------- */}
            <View style={{ marginTop: espaco.xl }}>
              <TituloSecao
                titulo="Os mais pedidos"
                acao="Ver cardápio"
                aoPressionar={() => irParaCardapio('Todos')}
                estilo={{ paddingHorizontal: espaco.lg }}
              />
              {carregando && produtos.length === 0 ? (
                <View style={estilos.carrossel}>
                  <View style={{ width: 168 }}>
                    <SkeletonCardProduto />
                  </View>
                  <View style={{ width: 168 }}>
                    <SkeletonCardProduto />
                  </View>
                </View>
              ) : maisPedidos.length > 0 ? (
                <FlatList
                  data={maisPedidos}
                  keyExtractor={(p) => String(p.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={estilos.carrossel}
                  renderItem={({ item }) => <CardProduto produto={item} aoAbrir={abrirProduto} largura={168} />}
                />
              ) : null}
            </View>

            {/* ---------- Ofertas especiais ---------- */}
            {promocoes.length > 0 ? (
              <View style={estilos.ofertas}>
                <View style={estilos.ofertasTitulo}>
                  <Icone nome="flash" cor={cores.destaque} tamanho={22} />
                  <Text style={[tipo.titulo, { color: cores.branco }]} accessibilityRole="header">
                    Ofertas especiais
                  </Text>
                </View>
                <Text style={{ ...tipo.legenda, color: cores.azulClaro, marginBottom: espaco.md }}>
                  Preços promocionais por tempo limitado.
                </Text>
                {promocoes.map((p) => (
                  <PressableScale
                    key={p.id}
                    onPress={() => abrirProduto(p)}
                    accessibilityRole="button"
                    accessibilityLabel={p.nome + ' em oferta por ' + moeda(p.precoPromocional as number)}
                    estilo={estilos.oferta}
                  >
                    <ImagemProduto item={p} estilo={estilos.ofertaImagem} />
                    <View style={{ flex: 1 }}>
                      <Selo texto={percentualDesconto(p) + '% OFF'} />
                      <Text style={estilos.ofertaNome} numberOfLines={1}>
                        {p.nome}
                      </Text>
                      <PrecoProduto produto={p} />
                    </View>
                    <PressableScale
                      onPress={() => adicionarRapido(p)}
                      accessibilityRole="button"
                      accessibilityLabel={'Adicionar ' + p.nome + ' ao carrinho'}
                      hitSlop={8}
                      escala={0.88}
                      estilo={estilos.ofertaAdd}
                    >
                      <Icone nome="add" cor={cores.textoNaPrimaria} tamanho={22} />
                    </PressableScale>
                  </PressableScale>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---------- Banners ----------

function BannerIntro({ largura, aoPressionar, temOfertas }: { largura: number; aoPressionar: () => void; temOfertas: boolean }) {
  return (
    <View style={[estilos.banner, { width: largura, backgroundColor: cores.primaria }]}>
      <View style={{ flex: 1, paddingRight: espaco.sm, justifyContent: 'center' }}>
        <Text style={estilos.bannerTitulo}>Seu lanche favorito está aqui!</Text>
        <Text style={estilos.bannerTexto}>Combos especiais para matar sua fome.</Text>
        <PressableScale
          onPress={aoPressionar}
          accessibilityRole="button"
          accessibilityLabel={temOfertas ? 'Ver ofertas' : 'Ver cardápio'}
          estilo={estilos.bannerBotao}
        >
          <Text style={estilos.bannerBotaoTexto}>{temOfertas ? 'Ver ofertas' : 'Ver cardápio'}</Text>
          <Icone nome="arrow-forward" cor={cores.textoNoDestaque} tamanho={16} />
        </PressableScale>
      </View>
      <Image source={fonteImagem({ imagem: 'combo2' })} style={estilos.bannerImagem} resizeMode="contain" accessibilityElementsHidden />
    </View>
  );
}

function BannerPromo({ largura, produto, aoPressionar }: { largura: number; produto: Produto; aoPressionar: () => void }) {
  return (
    <View style={[estilos.banner, { width: largura, backgroundColor: cores.marcaClara }]}>
      <View style={{ flex: 1, paddingRight: espaco.sm, justifyContent: 'center' }}>
        <Selo texto={percentualDesconto(produto) + '% OFF'} />
        <Text style={[estilos.bannerTitulo, { fontSize: 19, lineHeight: 24, marginTop: espaco.sm }]} numberOfLines={2}>
          {produto.nome}
        </Text>
        <Text style={estilos.bannerTexto}>
          Por {moeda(produto.precoPromocional as number)}{' '}
          <Text style={{ textDecorationLine: 'line-through', opacity: 0.7 }}>{moeda(produto.preco)}</Text>
        </Text>
        <PressableScale
          onPress={aoPressionar}
          accessibilityRole="button"
          accessibilityLabel={'Pedir ' + produto.nome}
          estilo={estilos.bannerBotao}
        >
          <Text style={estilos.bannerBotaoTexto}>Pedir agora</Text>
          <Icone nome="arrow-forward" cor={cores.textoNoDestaque} tamanho={16} />
        </PressableScale>
      </View>
      <Image source={fonteImagem(produto)} style={estilos.bannerImagem} resizeMode="contain" accessibilityElementsHidden />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: {
    backgroundColor: cores.marca,
    paddingHorizontal: espaco.lg,
    paddingBottom: espaco.xxxl,
    borderBottomLeftRadius: raio.xl,
    borderBottomRightRadius: raio.xl,
  },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginTop: espaco.xs },
  logo: { width: 86, height: 48 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cores.destaque,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: cores.textoNoDestaque, fontWeight: '800', fontSize: 18 },
  saudacao: { ...tipo.display, color: cores.branco, marginTop: espaco.md },
  subSaudacao: { ...tipo.corpo, color: cores.azulClaro, marginTop: 2 },
  chipEndereco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: espaco.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: raio.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipTexto: { color: cores.branco, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    marginHorizontal: espaco.lg,
    marginTop: -26,
    minHeight: 52,
    paddingHorizontal: espaco.lg,
    backgroundColor: cores.superficie,
    borderRadius: raio.pill,
    borderWidth: 1.5,
    borderColor: cores.borda,
    ...sombra,
  },
  buscaFoco: { borderColor: cores.primaria },
  buscaCampo: { flex: 1, fontSize: 15, color: cores.texto, paddingVertical: 12 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: raio.lg,
    padding: espaco.lg,
    minHeight: 168,
    overflow: 'hidden',
  },
  bannerTitulo: { ...tipo.titulo, color: cores.branco },
  bannerTexto: { ...tipo.corpo, color: cores.azulClaro, marginTop: 4 },
  bannerBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: espaco.md,
    backgroundColor: cores.destaque,
    borderRadius: raio.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bannerBotaoTexto: { color: cores.textoNoDestaque, fontWeight: '800', fontSize: 14 },
  bannerImagem: { width: 128, height: 128 },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: espaco.md },
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: cores.borda },
  pontoAtivo: { width: 18, backgroundColor: cores.primaria },
  atalho: { alignItems: 'center', width: 78 },
  atalhoIcone: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: cores.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoImagem: { width: 52, height: 52 },
  atalhoRotulo: { ...tipo.legenda, color: cores.texto, fontWeight: '600', marginTop: 6 },
  carrossel: { flexDirection: 'row', gap: espaco.md, paddingHorizontal: espaco.lg, paddingTop: espaco.md, paddingBottom: espaco.sm },
  grade: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: espaco.md },
  celulaGrade: { width: '50%', padding: 6 },
  ofertas: {
    backgroundColor: cores.marca,
    marginHorizontal: espaco.lg,
    marginTop: espaco.xl,
    borderRadius: raio.xl,
    padding: espaco.lg,
  },
  ofertasTitulo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginBottom: 2 },
  oferta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espaco.sm,
    marginTop: espaco.sm,
  },
  ofertaImagem: { width: 92, aspectRatio: 1 },
  ofertaNome: { ...tipo.corpoForte, fontWeight: '800', marginTop: 4 },
  ofertaAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
});
