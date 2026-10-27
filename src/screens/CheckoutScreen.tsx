import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimacaoSucesso } from '../components/AnimacaoSucesso';
import { Icone, NomeIcone } from '../components/Icone';
import { PressableScale } from '../components/PressableScale';
import { Aviso, Botao } from '../components/ui';
import { config } from '../config';
import { useCarrinho } from '../context/CarrinhoContext';
import { textoEndereco, useEnderecos } from '../context/EnderecosContext';
import { useSincronizacao } from '../context/SincronizacaoContext';
import { calcularResumo, descreverPersonalizacao, precoUnitario } from '../domain/preco';
import { api, ehErroDeRede, mensagemDeErro } from '../services';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco, raio, sombra, tipo } from '../theme';
import { FormaPagamento, Modalidade, NovoPedido } from '../types';
import { moeda, novaChave, ROTULO_PAGAMENTO } from '../utils/formatar';

type Props = NativeStackScreenProps<AppStackParamList, 'Checkout'>;

const FORMAS: { id: FormaPagamento; icone: NomeIcone; detalhe: string }[] = [
  { id: 'Pix', icone: 'qr-code', detalhe: 'Pague na entrega ou retirada' },
  { id: 'Cartao', icone: 'card', detalhe: 'Maquininha na entrega ou retirada' },
  { id: 'Dinheiro', icone: 'cash', detalhe: 'Pague na entrega ou retirada' },
];

type Resultado = { tipo: 'enviado'; pedidoId: number } | { tipo: 'fila' } | null;

export default function CheckoutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { itens, limpar } = useCarrinho();
  const { guardarParaDepois } = useSincronizacao();
  const { enderecos, selecionado: endereco } = useEnderecos();

  const [modalidade, setModalidade] = useState<Modalidade>('Entrega');
  const [pagamento, setPagamento] = useState<FormaPagamento>('Pix');
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState('');
  const [erroEndereco, setErroEndereco] = useState('');
  const [resultado, setResultado] = useState<Resultado>(null);

  // Na tela de sucesso não faz sentido voltar ao carrinho: esconde o cabeçalho e o gesto de voltar.
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: !resultado, gestureEnabled: !resultado });
  }, [navigation, resultado]);

  // A mesma chave é reutilizada em novas tentativas, evitando pedido duplicado no servidor.
  const [chave] = useState(novaChave);
  // Trava síncrona contra toques repetidos: o estado React só atualiza depois do próximo render.
  const travado = useRef(false);

  const resumo = useMemo(() => calcularResumo(itens, modalidade), [itens, modalidade]);
  const previsao = modalidade === 'Entrega' ? config.PREVISAO_ENTREGA_MIN : config.PREVISAO_RETIRADA_MIN;

  async function confirmar() {
    if (travado.current || itens.length === 0) return;
    setErroGeral('');

    if (modalidade === 'Entrega' && !endereco) {
      setErroEndereco('Escolha ou cadastre um endereço de entrega.');
      return;
    }
    setErroEndereco('');

    travado.current = true;
    setEnviando(true);

    const novo: NovoPedido = {
      chaveIdempotencia: chave,
      modalidade,
      itens: itens.map((i) => ({
        produtoId: i.produto.id,
        quantidade: i.quantidade,
        observacao: i.personalizacao.observacao,
        tamanhoId: i.personalizacao.tamanhoId,
        adicionaisIds: i.personalizacao.adicionaisIds,
        ingredientesRemovidos: i.personalizacao.ingredientesRemovidos,
      })),
      enderecoEntrega: modalidade === 'Entrega' && endereco ? textoEndereco(endereco) : '',
      formaPagamento: pagamento,
    };

    try {
      const pedido = await api.criarPedido(novo);
      limpar();
      setResultado({ tipo: 'enviado', pedidoId: pedido.id });
    } catch (e) {
      if (ehErroDeRede(e)) {
        // Sem internet: o pedido não se perde. Fica na fila e é enviado quando a conexão voltar.
        await guardarParaDepois(novo, { total: resumo.total, quantidadeItens: resumo.quantidadeItens });
        limpar();
        setResultado({ tipo: 'fila' });
      } else {
        setErroGeral(mensagemDeErro(e));
        setEnviando(false);
        travado.current = false;
      }
    }
  }

  if (resultado) {
    return resultado.tipo === 'enviado' ? (
      <AnimacaoSucesso
        titulo="Pedido confirmado!"
        texto={'Seu pedido #' + resultado.pedidoId + ' foi enviado para a cozinha.'}
        aoTerminar={() => navigation.replace('Acompanhamento', { pedidoId: resultado.pedidoId })}
      />
    ) : (
      <AnimacaoSucesso
        icone="cloud-upload"
        cor={cores.alerta}
        titulo="Pedido salvo"
        texto="Você está sem conexão. Vamos enviar o pedido automaticamente assim que a internet voltar."
        aoTerminar={() => navigation.navigate('Tabs', { screen: 'Pedidos' })}
      />
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={[]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.xl }} keyboardShouldPersistTaps="handled">
          {erroGeral ? <Aviso tipo="erro" texto={erroGeral} /> : null}

          {/* 1. Modalidade */}
          <Bloco numero={1} titulo="Como você quer receber?">
            <View style={{ flexDirection: 'row', gap: espaco.md }}>
              {([
                { id: 'Entrega', icone: 'bicycle', titulo: 'Entrega', detalhe: '~' + config.PREVISAO_ENTREGA_MIN + ' min' },
                { id: 'Retirada', icone: 'storefront', titulo: 'Retirada', detalhe: '~' + config.PREVISAO_RETIRADA_MIN + ' min' },
              ] as { id: Modalidade; icone: NomeIcone; titulo: string; detalhe: string }[]).map((m) => {
                const ativo = modalidade === m.id;
                return (
                  <PressableScale
                    key={m.id}
                    onPress={() => setModalidade(m.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: ativo }}
                    accessibilityLabel={m.titulo + ', cerca de ' + (m.id === 'Entrega' ? config.PREVISAO_ENTREGA_MIN : config.PREVISAO_RETIRADA_MIN) + ' minutos'}
                    estilo={[estilos.modalidade, ativo && estilos.selecionado]}
                  >
                    <Icone nome={m.icone} cor={ativo ? cores.primaria : cores.textoSuave} tamanho={26} />
                    <Text style={[tipo.corpoForte, { marginTop: 6 }]}>{m.titulo}</Text>
                    <Text style={tipo.legenda}>{m.detalhe}</Text>
                  </PressableScale>
                );
              })}
            </View>
          </Bloco>

          {/* 2. Endereço */}
          {modalidade === 'Entrega' ? (
            <Bloco numero={2} titulo="Endereço de entrega">
              {endereco ? (
                <View style={[estilos.cartao, estilos.selecionado]}>
                  <Icone nome="location" cor={cores.primaria} tamanho={22} />
                  <View style={{ flex: 1 }}>
                    <Text style={tipo.corpoForte}>{endereco.apelido || 'Endereço'}</Text>
                    <Text style={tipo.legenda}>{textoEndereco(endereco)}</Text>
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('Enderecos', { escolher: true })}
                    accessibilityRole="button"
                    accessibilityLabel="Trocar endereço"
                    hitSlop={8}
                  >
                    <Text style={estilos.link}>Trocar</Text>
                  </Pressable>
                </View>
              ) : (
                <Botao
                  titulo="Cadastrar endereço"
                  icone="add-circle-outline"
                  variante="secundario"
                  aoPressionar={() => navigation.navigate('EnderecoForm')}
                />
              )}
              {enderecos.length > 0 && !endereco ? null : null}
              {erroEndereco ? (
                <Text accessibilityLiveRegion="polite" style={{ color: cores.erro, fontSize: 13, marginTop: espaco.sm }}>
                  {erroEndereco}
                </Text>
              ) : null}
            </Bloco>
          ) : (
            <Bloco numero={2} titulo="Retirada no balcão">
              <View style={estilos.cartao}>
                <Icone nome="storefront" cor={cores.primaria} tamanho={22} />
                <View style={{ flex: 1 }}>
                  <Text style={tipo.corpoForte}>{config.NOME_LOJA}</Text>
                  <Text style={tipo.legenda}>Avisaremos quando o pedido estiver pronto. Sem taxa de entrega.</Text>
                </View>
              </View>
            </Bloco>
          )}

          {/* 3. Pagamento */}
          <Bloco numero={3} titulo="Pagamento">
            {FORMAS.map((f) => {
              const ativo = pagamento === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setPagamento(f.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  accessibilityLabel={ROTULO_PAGAMENTO[f.id] + ', ' + f.detalhe}
                  style={[estilos.cartao, { marginBottom: espaco.sm }, ativo && estilos.selecionado]}
                >
                  <Icone nome={f.icone} cor={ativo ? cores.primaria : cores.textoSuave} tamanho={22} />
                  <View style={{ flex: 1 }}>
                    <Text style={tipo.corpoForte}>{ROTULO_PAGAMENTO[f.id]}</Text>
                    <Text style={tipo.legenda}>{f.detalhe}</Text>
                  </View>
                  <View style={[estilos.radio, ativo && { borderColor: cores.primaria }]}>{ativo ? <View style={estilos.radioMiolo} /> : null}</View>
                </Pressable>
              );
            })}
            <Aviso
              tipo="info"
              texto="Pagamento SIMULADO (projeto acadêmico): o app não processa cobranças. A forma escolhida fica registrada no pedido."
            />
          </Bloco>

          {/* 4. Revisão */}
          <Bloco numero={4} titulo="Revise seu pedido">
            <View style={estilos.resumo}>
              {itens.map((i) => {
                const detalhes = descreverPersonalizacao(i.produto, i.personalizacao);
                return (
                  <View key={i.chave} style={{ marginBottom: espaco.md }}>
                    <View style={estilos.linha}>
                      <Text style={[tipo.corpoForte, { flex: 1 }]} numberOfLines={2}>
                        {i.quantidade}× {i.produto.nome}
                      </Text>
                      <Text style={tipo.corpoForte}>{moeda(precoUnitario(i.produto, i.personalizacao) * i.quantidade)}</Text>
                    </View>
                    {detalhes.map((d) => (
                      <Text key={d} style={tipo.legenda}>
                        {d}
                      </Text>
                    ))}
                    {i.personalizacao.observacao ? (
                      <Text style={[tipo.legenda, { fontStyle: 'italic' }]}>“{i.personalizacao.observacao}”</Text>
                    ) : null}
                  </View>
                );
              })}
              <View style={estilos.divisor} />
              <Linha rotulo="Modalidade" valor={modalidade === 'Entrega' ? 'Entrega (~' + previsao + ' min)' : 'Retirada (~' + previsao + ' min)'} />
              <Linha rotulo="Pagamento" valor={ROTULO_PAGAMENTO[pagamento]} />
              <View style={estilos.divisor} />
              <Linha rotulo="Subtotal" valor={moeda(resumo.subtotal)} />
              {resumo.desconto > 0 ? <Linha rotulo="Descontos" valor={'− ' + moeda(resumo.desconto)} cor={cores.sucesso} /> : null}
              <Linha
                rotulo="Taxa de entrega"
                valor={modalidade === 'Retirada' ? 'Não se aplica' : resumo.taxaEntrega === 0 ? 'Grátis' : moeda(resumo.taxaEntrega)}
                cor={modalidade === 'Entrega' && resumo.taxaEntrega === 0 ? cores.sucesso : undefined}
              />
              <View style={estilos.divisor} />
              <Linha rotulo="Total" valor={moeda(resumo.total)} forte />
            </View>
            <Text style={[tipo.legenda, { marginTop: espaco.sm }]}>O valor final é confirmado pela hamburgueria ao receber o pedido.</Text>
          </Bloco>
        </ScrollView>

        <View style={[estilos.rodape, { paddingBottom: Math.max(insets.bottom, espaco.lg) }]}>
          <Botao
            titulo={'Confirmar pedido • ' + moeda(resumo.total)}
            rotuloAcessivel={'Confirmar pedido, total ' + moeda(resumo.total)}
            aoPressionar={confirmar}
            carregando={enviando}
            desabilitado={itens.length === 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bloco({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginBottom: espaco.md }}>
        <View style={estilos.numero}>
          <Text style={{ color: cores.textoNaPrimaria, fontWeight: '800', fontSize: 13 }}>{numero}</Text>
        </View>
        <Text accessibilityRole="header" style={tipo.subtitulo}>
          {titulo}
        </Text>
      </View>
      {children}
    </View>
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
  numero: { width: 24, height: 24, borderRadius: 12, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
  modalidade: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: espaco.lg,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: cores.borda,
  },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 62,
    padding: espaco.md,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: cores.borda,
  },
  selecionado: { borderColor: cores.primaria, backgroundColor: cores.superficie2 },
  link: { color: cores.primaria, fontWeight: '800', fontSize: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: cores.borda, alignItems: 'center', justifyContent: 'center' },
  radioMiolo: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.primaria },
  resumo: { backgroundColor: cores.superficie, borderRadius: raio.lg, padding: espaco.lg, borderWidth: 1, borderColor: cores.borda, ...sombra },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: espaco.md, marginBottom: espaco.sm },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: espaco.sm },
  rodape: { padding: espaco.lg, borderTopWidth: 1, borderTopColor: cores.borda, backgroundColor: cores.superficie },
});
