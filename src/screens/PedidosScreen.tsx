import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icone } from '../components/Icone';
import { PressableScale } from '../components/PressableScale';
import { ImagemProduto } from '../components/ProdutoCards';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { Aviso, Botao, EstadoVazio, Selo } from '../components/ui';
import { useCarrinho } from '../context/CarrinhoContext';
import { useSincronizacao } from '../context/SincronizacaoContext';
import { itensParaRefazer } from '../domain/pedido';
import { useCardapio } from '../hooks/useCardapio';
import { mensagemDeErro } from '../services';
import { obterPedidos } from '../services/sincronizacao';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco, raio, sombra, tipo } from '../theme';
import { Pedido, PedidoPendente } from '../types';
import { dataHora, moeda, pedidoFinalizado, ROTULO_STATUS } from '../utils/formatar';

type Aba = 'andamento' | 'historico';

export default function PedidosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const toast = useToast();
  const { adicionar } = useCarrinho();
  const { produtos } = useCardapio();
  const { pendentes, versaoPedidos, sincronizarAgora } = useSincronizacao();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [copiaDe, setCopiaDe] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>('andamento');

  const carregar = useCallback(async (puxar = false) => {
    if (puxar) setAtualizando(true);
    setErro('');
    try {
      const r = await obterPedidos();
      setPedidos(r.dados);
      setCopiaDe(r.origem === 'cache' ? r.atualizadoEm : null);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  // Recarrega ao abrir a aba, ao voltar para ela e sempre que um pedido da fila for enviado.
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar, versaoPedidos])
  );

  const emAndamento = useMemo(() => pedidos.filter((p) => !pedidoFinalizado(p.status)), [pedidos]);
  const historico = useMemo(() => pedidos.filter((p) => pedidoFinalizado(p.status)), [pedidos]);
  const lista = aba === 'andamento' ? emAndamento : historico;

  function pedirDeNovo(p: Pedido) {
    const { itens, ignorados } = itensParaRefazer(p, produtos);
    if (itens.length === 0) {
      toast.mostrar('Os itens deste pedido não estão disponíveis agora.', 'erro');
      return;
    }
    itens.forEach((i) => adicionar(i.produto, i.quantidade, i.personalizacao));
    toast.mostrar(
      ignorados.length > 0 ? 'Itens adicionados. Indisponíveis: ' + ignorados.join(', ') : 'Itens adicionados ao carrinho',
      ignorados.length > 0 ? 'info' : 'sucesso'
    );
    navigation.navigate('Carrinho');
  }

  function itemPendente(p: PedidoPendente) {
    return (
      <View key={p.chaveIdempotencia} style={[estilos.cartao, { borderColor: cores.alerta, backgroundColor: cores.alertaFundo }]}>
        <View style={estilos.topo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
            <Icone nome="cloud-offline" cor={cores.alerta} tamanho={20} />
            <Text style={tipo.subtitulo}>Aguardando conexão</Text>
          </View>
        </View>
        <Text style={tipo.legenda}>
          {p.resumo.quantidadeItens === 1 ? '1 item' : p.resumo.quantidadeItens + ' itens'} · {moeda(p.resumo.total)} · feito em {dataHora(p.criadoEm)}
        </Text>
        <Text style={[tipo.legenda, { marginTop: espaco.xs }]}>Será enviado automaticamente quando a internet voltar.</Text>
      </View>
    );
  }

  function renderPedido({ item }: { item: Pedido }) {
    const finalizado = pedidoFinalizado(item.status);
    const cancelado = item.status === 'Cancelado';
    return (
      <PressableScale
        onPress={() => navigation.navigate('Acompanhamento', { pedidoId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={'Pedido ' + item.id + ', ' + ROTULO_STATUS[item.status] + ', total ' + moeda(item.total) + '. Toque para ver detalhes.'}
        estilo={estilos.cartao}
      >
        <View style={estilos.topo}>
          <Text style={tipo.subtitulo}>Pedido #{item.id}</Text>
          <Selo
            texto={ROTULO_STATUS[item.status]}
            variante={cancelado ? 'neutro' : finalizado ? 'sucesso' : 'destaque'}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: espaco.sm }}>
          {item.itens.slice(0, 4).map((i, idx) => (
            <ImagemProduto key={idx} item={i} estilo={estilos.miniatura} />
          ))}
          {item.itens.length > 4 ? (
            <View style={[estilos.miniatura, { alignItems: 'center', justifyContent: 'center', backgroundColor: cores.superficie2 }]}>
              <Text style={{ color: cores.primariaEscura, fontWeight: '800' }}>+{item.itens.length - 4}</Text>
            </View>
          ) : null}
        </View>
        <Text style={tipo.legenda} numberOfLines={2}>
          {item.itens.map((i) => i.quantidade + '× ' + i.nome).join(', ')}
        </Text>
        <View style={estilos.rodapeCartao}>
          <Text style={tipo.legenda}>
            {dataHora(item.criadoEm)} · <Text style={{ color: cores.primaria, fontWeight: '800' }}>{moeda(item.total)}</Text>
          </Text>
          {finalizado ? (
            <Pressable
              onPress={() => pedirDeNovo(item)}
              accessibilityRole="button"
              accessibilityLabel={'Pedir de novo o pedido ' + item.id}
              hitSlop={8}
              style={estilos.refazer}
            >
              <Icone nome="refresh" cor={cores.primaria} tamanho={16} />
              <Text style={{ color: cores.primaria, fontWeight: '800', fontSize: 13 }}>Pedir de novo</Text>
            </Pressable>
          ) : (
            <Text style={{ color: cores.primaria, fontWeight: '800', fontSize: 13 }}>Acompanhar</Text>
          )}
        </View>
      </PressableScale>
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <View style={{ padding: espaco.lg, paddingBottom: espaco.md }}>
        <Text accessibilityRole="header" style={tipo.display}>
          Meus pedidos
        </Text>
        <View style={estilos.segmentos} accessibilityRole="tablist">
          {([
            { id: 'andamento', rotulo: 'Em andamento', n: emAndamento.length + pendentes.length },
            { id: 'historico', rotulo: 'Histórico', n: historico.length },
          ] as { id: Aba; rotulo: string; n: number }[]).map((s) => {
            const ativo = aba === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setAba(s.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={s.rotulo + ', ' + s.n}
                style={[estilos.segmento, ativo && estilos.segmentoAtivo]}
              >
                <Text style={[estilos.segmentoTexto, ativo && { color: cores.primariaEscura }]}>
                  {s.rotulo} {s.n > 0 ? '(' + s.n + ')' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {carregando ? (
        <View style={{ paddingHorizontal: espaco.lg, gap: espaco.md }}>
          <Skeleton altura={120} arredondamento={raio.lg} />
          <Skeleton altura={120} arredondamento={raio.lg} />
        </View>
      ) : erro && pedidos.length === 0 && pendentes.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EstadoVazio
            icone="cloud-offline-outline"
            titulo="Não foi possível carregar"
            texto={erro}
            acao={{ titulo: 'Tentar de novo', aoPressionar: () => carregar() }}
          />
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderPedido}
          contentContainerStyle={{ paddingHorizontal: espaco.lg, paddingBottom: espaco.xxl, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => {
                sincronizarAgora();
                carregar(true);
              }}
              tintColor={cores.primaria}
              colors={[cores.primaria]}
            />
          }
          ListHeaderComponent={
            <View>
              {copiaDe ? <Aviso texto={'Sem conexão: lista salva em ' + dataHora(copiaDe) + '.'} /> : null}
              {aba === 'andamento' ? pendentes.map(itemPendente) : null}
            </View>
          }
          ListEmptyComponent={
            aba === 'andamento' && pendentes.length > 0 ? null : (
              <EstadoVazio
                icone="receipt-outline"
                titulo={aba === 'andamento' ? 'Nenhum pedido em andamento' : 'Nenhum pedido no histórico'}
                texto={aba === 'andamento' ? 'Quando você pedir, ele aparece aqui para acompanhar.' : 'Pedidos concluídos ou cancelados aparecem aqui.'}
                acao={
                  aba === 'andamento'
                    ? { titulo: 'Ver cardápio', aoPressionar: () => navigation.navigate('Tabs', { screen: 'Cardapio', params: { filtro: 'Todos', ts: Date.now() } }) }
                    : undefined
                }
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  segmentos: { flexDirection: 'row', backgroundColor: cores.superficie2, borderRadius: raio.pill, padding: 4, marginTop: espaco.md },
  segmento: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: raio.pill },
  segmentoAtivo: { backgroundColor: cores.superficie, ...sombra },
  segmentoTexto: { color: cores.textoSuave, fontWeight: '700', fontSize: 14 },
  cartao: { backgroundColor: cores.superficie, borderRadius: raio.lg, ...sombra, padding: espaco.lg, marginBottom: espaco.md, borderWidth: 1, borderColor: cores.borda },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espaco.sm },
  miniatura: { width: 48, height: 48, aspectRatio: undefined, borderRadius: raio.sm },
  rodapeCartao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: espaco.md },
  refazer: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 34 },
});
