import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icone, NomeIcone } from '../components/Icone';
import { ImagemProduto } from '../components/ProdutoCards';
import { Skeleton } from '../components/Skeleton';
import { Aviso, Botao, Selo } from '../components/ui';
import { config } from '../config';
import { api, ehErroDeRede, mensagemDeErro } from '../services';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco, raio, sombra, tipo } from '../theme';
import { Modalidade, Pedido, StatusPedido } from '../types';
import { dataHora, hora, horaCompleta, moeda, pedidoFinalizado, ROTULO_MODALIDADE, ROTULO_PAGAMENTO, ROTULO_STATUS } from '../utils/formatar';

type Props = NativeStackScreenProps<AppStackParamList, 'Acompanhamento'>;

interface Etapa {
  status: StatusPedido;
  titulo: string;
  icone: NomeIcone;
  detalhe: string;
}

function etapasDe(modalidade: Modalidade): Etapa[] {
  return [
    { status: 'Recebido', titulo: 'Pedido recebido', icone: 'receipt', detalhe: 'Recebemos o seu pedido.' },
    { status: 'Confirmado', titulo: 'Pedido confirmado', icone: 'checkmark-circle', detalhe: 'A hamburgueria confirmou o pedido.' },
    { status: 'EmPreparo', titulo: 'Em preparação', icone: 'flame', detalhe: 'Seu lanche está sendo preparado.' },
    modalidade === 'Retirada'
      ? { status: 'ProntoParaRetirada', titulo: 'Pronto para retirada', icone: 'storefront', detalhe: 'Pode vir buscar no balcão.' }
      : { status: 'SaiuParaEntrega', titulo: 'Saiu para entrega', icone: 'bicycle', detalhe: 'O entregador está a caminho.' },
    { status: 'Entregue', titulo: 'Pedido concluído', icone: 'happy', detalhe: 'Bom apetite!' },
  ];
}

export default function AcompanhamentoScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { pedidoId } = route.params;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erro, setErro] = useState('');
  const [semConexao, setSemConexao] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const finalizado = useRef(false);

  const buscar = useCallback(async () => {
    try {
      const p = await api.obterPedido(pedidoId);
      setPedido(p);
      setErro('');
      setSemConexao(false);
      setAtualizadoEm(new Date());
      finalizado.current = pedidoFinalizado(p.status);
    } catch (e) {
      if (ehErroDeRede(e)) setSemConexao(true);
      else setErro(mensagemDeErro(e));
    }
  }, [pedidoId]);

  // Polling: consulta a API de tempos em tempos até o pedido ser concluído (ou cancelado).
  useEffect(() => {
    buscar();
    const id = setInterval(() => {
      if (!finalizado.current) buscar();
    }, config.INTERVALO_POLLING_MS);
    return () => clearInterval(id);
  }, [buscar]);

  async function puxar() {
    setAtualizando(true);
    await buscar();
    setAtualizando(false);
  }

  // Pulso discreto no indicador da etapa atual.
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.18, duration: 800, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulso]);

  if (!pedido) {
    return (
      <SafeAreaView style={estilos.tela} edges={[]}>
        <View style={{ padding: espaco.lg, gap: espaco.md }}>
          {erro ? (
            <>
              <Aviso tipo="erro" texto={erro} />
              <Botao titulo="Tentar de novo" icone="refresh" aoPressionar={buscar} />
            </>
          ) : (
            <>
              <Skeleton altura={28} largura="50%" />
              <Skeleton altura={200} arredondamento={raio.lg} />
              <Skeleton altura={120} arredondamento={raio.lg} />
              <Text style={[tipo.legenda, { textAlign: 'center' }]}>
                {semConexao ? 'Sem conexão. Tentando novamente…' : 'Buscando seu pedido…'}
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const etapas = etapasDe(pedido.modalidade);
  const indiceAtual = etapas.findIndex((e) => e.status === pedido.status);
  const cancelado = pedido.status === 'Cancelado';
  const concluido = pedido.status === 'Entregue';

  function horaDaEtapa(s: StatusPedido): string | null {
    const ev = pedido ? pedido.historico.find((h) => h.status === s) : undefined;
    return ev ? hora(ev.em) : null;
  }

  return (
    <SafeAreaView style={estilos.tela} edges={[]}>
      <ScrollView
        contentContainerStyle={{ padding: espaco.lg, paddingBottom: espaco.xxl + insets.bottom }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={puxar} tintColor={cores.primaria} colors={[cores.primaria]} />}
      >
        {semConexao ? <Aviso texto="Sem conexão: mostrando a última informação recebida." /> : null}

        <View style={estilos.topo}>
          <View style={{ flex: 1 }}>
            <Text style={tipo.legenda}>Pedido #{pedido.id}</Text>
            <Text accessibilityRole="header" style={tipo.display}>
              {ROTULO_STATUS[pedido.status]}
            </Text>
            {!pedidoFinalizado(pedido.status) ? (
              <Text style={[tipo.corpo, { color: cores.textoSuave, marginTop: 2 }]}>
                {pedido.modalidade === 'Retirada' ? 'Retirada' : 'Entrega'} em cerca de {pedido.previsaoEntregaMin} min após o pedido
              </Text>
            ) : null}
          </View>
          <Selo texto={ROTULO_MODALIDADE[pedido.modalidade]} variante="neutro" icone={pedido.modalidade === 'Retirada' ? 'storefront' : 'bicycle'} />
        </View>

        {config.USAR_MOCK && !cancelado ? (
          <View style={{ marginTop: espaco.lg }}>
            <Aviso
              tipo="info"
              icone="flask"
              texto="Modo demonstração: o status avança sozinho em poucos segundos. Não é rastreamento real."
            />
          </View>
        ) : null}

        {cancelado ? (
          <View style={{ marginTop: espaco.lg }}>
            <Aviso tipo="erro" texto="Este pedido foi cancelado." />
          </View>
        ) : (
          <View style={estilos.linhaDoTempo} accessibilityLabel={'Etapa atual: ' + ROTULO_STATUS[pedido.status]}>
            {etapas.map((etapa, i) => {
              const feita = i <= indiceAtual;
              const atual = i === indiceAtual && !concluido;
              const h = horaDaEtapa(etapa.status);
              return (
                <View key={etapa.status} style={estilos.etapa}>
                  <View style={estilos.coluna}>
                    <Animated.View
                      style={[
                        estilos.bolinha,
                        feita && estilos.bolinhaFeita,
                        atual && { transform: [{ scale: pulso }] },
                      ]}
                    >
                      <Icone nome={feita ? etapa.icone : 'ellipse-outline'} cor={feita ? cores.branco : cores.textoSuave} tamanho={feita ? 20 : 14} />
                    </Animated.View>
                    {i < etapas.length - 1 ? <View style={[estilos.trilha, i < indiceAtual && { backgroundColor: cores.primaria }]} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: espaco.xl }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[estilos.etapaTitulo, !feita && { color: cores.textoSuave, fontWeight: '600' }]}>{etapa.titulo}</Text>
                      {h ? <Text style={tipo.legenda}>{h}</Text> : null}
                    </View>
                    {atual || (concluido && i === indiceAtual) ? <Text style={tipo.legenda}>{etapa.detalhe}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text accessibilityRole="header" style={[tipo.subtitulo, { marginBottom: espaco.md }]}>
          Resumo do pedido
        </Text>
        <View style={estilos.caixa}>
          {pedido.itens.map((i, idx) => (
            <View key={idx} style={estilos.item}>
              <ImagemProduto item={i} estilo={estilos.foto} />
              <View style={{ flex: 1 }}>
                <Text style={tipo.corpoForte}>
                  {i.quantidade}× {i.nome}
                </Text>
                {(i.detalhes ?? []).map((d) => (
                  <Text key={d} style={tipo.legenda}>
                    {d}
                  </Text>
                ))}
                {i.observacao ? <Text style={[tipo.legenda, { fontStyle: 'italic' }]}>“{i.observacao}”</Text> : null}
              </View>
              <Text style={tipo.corpoForte}>{moeda(i.precoUnitario * i.quantidade)}</Text>
            </View>
          ))}
          <View style={estilos.divisor} />
          <Linha rotulo="Subtotal" valor={moeda(pedido.subtotal)} />
          {pedido.desconto > 0 ? <Linha rotulo="Descontos" valor={'− ' + moeda(pedido.desconto)} cor={cores.sucesso} /> : null}
          {pedido.modalidade === 'Entrega' ? (
            <Linha rotulo="Taxa de entrega" valor={pedido.taxaEntrega === 0 ? 'Grátis' : moeda(pedido.taxaEntrega)} />
          ) : null}
          <View style={estilos.divisor} />
          <Linha rotulo="Total" valor={moeda(pedido.total)} forte />
        </View>

        <View style={[estilos.caixa, { marginTop: espaco.md, gap: espaco.md }]}>
          <Info icone={pedido.modalidade === 'Retirada' ? 'storefront' : 'location'} rotulo={pedido.modalidade === 'Retirada' ? 'Retirada' : 'Endereço de entrega'} valor={pedido.modalidade === 'Retirada' ? 'No balcão da ' + config.NOME_LOJA : pedido.enderecoEntrega} />
          <Info icone="wallet" rotulo="Pagamento (simulado)" valor={ROTULO_PAGAMENTO[pedido.formaPagamento]} />
          <Info icone="time" rotulo="Feito em" valor={dataHora(pedido.criadoEm)} />
        </View>

        {atualizadoEm ? (
          <Text style={[tipo.legenda, { textAlign: 'center', marginTop: espaco.lg }]}>
            Atualizado às {horaCompleta(atualizadoEm)}
            {!pedidoFinalizado(pedido.status) ? ' · atualização automática' : ''}
          </Text>
        ) : null}

        <Botao
          titulo="Ver meus pedidos"
          variante="secundario"
          aoPressionar={() => navigation.navigate('Tabs', { screen: 'Pedidos' })}
          estilo={{ marginTop: espaco.lg }}
        />
      </ScrollView>
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

function Info({ icone, rotulo, valor }: { icone: NomeIcone; rotulo: string; valor: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' }}>
      <Icone nome={icone} cor={cores.primaria} tamanho={20} />
      <View style={{ flex: 1 }}>
        <Text style={tipo.legenda}>{rotulo}</Text>
        <Text style={tipo.corpoForte}>{valor}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.md },
  linhaDoTempo: { marginTop: espaco.xl, marginBottom: espaco.sm, backgroundColor: cores.superficie, borderRadius: raio.lg, padding: espaco.lg, paddingBottom: espaco.sm, borderWidth: 1, borderColor: cores.borda },
  etapa: { flexDirection: 'row' },
  coluna: { alignItems: 'center', marginRight: espaco.md },
  bolinha: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: cores.superficie2,
    borderWidth: 2,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolinhaFeita: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  trilha: { width: 3, flex: 1, backgroundColor: cores.borda, marginVertical: 2, borderRadius: 2 },
  etapaTitulo: { color: cores.texto, fontSize: 16, fontWeight: '800', marginTop: 8 },
  caixa: { backgroundColor: cores.superficie, borderRadius: raio.lg, ...sombra, padding: espaco.lg, borderWidth: 1, borderColor: cores.borda },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.md, marginBottom: espaco.md },
  foto: { width: 52, height: 52, aspectRatio: undefined },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espaco.sm },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: espaco.sm },
});
