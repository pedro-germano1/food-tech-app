import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ALVO_MINIMO, cores, espaco, raio, tipo } from '../theme';
import { Icone, NomeIcone } from './Icone';
import { PressableScale } from './PressableScale';

const sombraBotao = {
  shadowColor: cores.primaria,
  shadowOpacity: 0.3,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

// ---------- Botão ----------

interface BotaoProps {
  titulo: string;
  aoPressionar: () => void;
  variante?: 'primario' | 'secundario' | 'perigo' | 'destaque';
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
  rotuloAcessivel?: string;
}

export function Botao({
  titulo,
  aoPressionar,
  variante = 'primario',
  icone,
  carregando = false,
  desabilitado = false,
  estilo,
  rotuloAcessivel,
}: BotaoProps) {
  const inativo = desabilitado || carregando;
  const fundo =
    variante === 'primario'
      ? cores.primaria
      : variante === 'destaque'
      ? cores.destaque
      : variante === 'perigo'
      ? 'transparent'
      : cores.superficie2;
  const corTexto =
    variante === 'primario'
      ? cores.textoNaPrimaria
      : variante === 'destaque'
      ? cores.textoNoDestaque
      : variante === 'perigo'
      ? cores.erro
      : cores.primariaEscura;

  return (
    <PressableScale
      onPress={aoPressionar}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel || titulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      estilo={[
        estilos.botao,
        {
          backgroundColor: fundo,
          opacity: inativo ? 0.55 : 1,
          borderWidth: variante === 'perigo' ? 1 : 0,
          borderColor: cores.erro,
        },
        variante === 'primario' ? sombraBotao : null,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <View style={estilos.botaoConteudo}>
          {icone ? <Icone nome={icone} cor={corTexto} tamanho={20} /> : null}
          <Text style={[tipo.botao, { color: corTexto }]}>{titulo}</Text>
        </View>
      )}
    </PressableScale>
  );
}

// ---------- Botão de ícone redondo ----------

export function BotaoIcone({
  icone,
  aoPressionar,
  rotulo,
  cor = cores.texto,
  fundo = cores.superficie,
  tamanho = 22,
  estilo,
}: {
  icone: NomeIcone;
  aoPressionar: () => void;
  rotulo: string;
  cor?: string;
  fundo?: string;
  tamanho?: number;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={6}
      escala={0.92}
      estilo={[estilos.botaoIcone, { backgroundColor: fundo }, estilo]}
    >
      <Icone nome={icone} cor={cor} tamanho={tamanho} />
    </PressableScale>
  );
}

// ---------- Campo de texto ----------

interface CampoProps extends TextInputProps {
  rotulo: string;
  erro?: string;
}

export function CampoTexto({ rotulo, erro, style, ...resto }: CampoProps) {
  return (
    <View style={{ marginBottom: espaco.lg }}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSuave}
        style={[estilos.campo, erro ? { borderColor: cores.erro } : null, style]}
        {...resto}
      />
      {erro ? (
        <Text accessibilityLiveRegion="polite" style={estilos.erro}>
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

// ---------- Faixa de aviso ----------

export function Aviso({
  texto,
  tipo: variante = 'alerta',
  icone,
}: {
  texto: string;
  tipo?: 'alerta' | 'sucesso' | 'erro' | 'info';
  icone?: NomeIcone;
}) {
  const cor =
    variante === 'sucesso' ? cores.sucesso : variante === 'erro' ? cores.erro : variante === 'info' ? cores.primariaEscura : cores.alerta;
  const fundo =
    variante === 'sucesso' ? cores.sucessoFundo : variante === 'erro' ? cores.erroFundo : variante === 'info' ? cores.superficie2 : cores.alertaFundo;
  const padrao: NomeIcone =
    variante === 'sucesso' ? 'checkmark-circle' : variante === 'erro' ? 'alert-circle' : variante === 'info' ? 'information-circle' : 'warning';
  return (
    <View accessibilityRole="alert" style={[estilos.aviso, { backgroundColor: fundo }]}>
      <Icone nome={icone ?? padrao} cor={cor} tamanho={20} />
      <Text style={{ color: cor, fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 }}>{texto}</Text>
    </View>
  );
}

// ---------- Seletor de quantidade ----------

export function Quantidade({
  valor,
  aoMudar,
  nome,
  compacto = false,
  minimo = 1,
}: {
  valor: number;
  aoMudar: (delta: number) => void;
  nome: string;
  compacto?: boolean;
  /** Abaixo deste valor o botão "−" vira lixeira (usado no carrinho). */
  minimo?: number;
}) {
  const lado = compacto ? 34 : ALVO_MINIMO;
  const remove = valor <= minimo && minimo <= 1 && compacto;
  return (
    <View style={estilos.qtdLinha}>
      <Pressable
        onPress={() => aoMudar(-1)}
        accessibilityRole="button"
        accessibilityLabel={(remove ? 'Remover ' : 'Diminuir quantidade de ') + nome}
        hitSlop={compacto ? 6 : 0}
        style={[estilos.qtdBotao, { width: lado, height: lado, borderRadius: lado / 2 }]}
      >
        <Icone nome={remove ? 'trash-outline' : 'remove'} cor={remove ? cores.erro : cores.primariaEscura} tamanho={compacto ? 18 : 22} />
      </Pressable>
      <Text accessibilityLabel={valor + ' unidades de ' + nome} style={[estilos.qtdValor, compacto && { minWidth: 28, fontSize: 16 }]}>
        {valor}
      </Text>
      <Pressable
        onPress={() => aoMudar(1)}
        accessibilityRole="button"
        accessibilityLabel={'Aumentar quantidade de ' + nome}
        hitSlop={compacto ? 6 : 0}
        style={[estilos.qtdBotao, { width: lado, height: lado, borderRadius: lado / 2, backgroundColor: cores.primaria }]}
      >
        <Icone nome="add" cor={cores.textoNaPrimaria} tamanho={compacto ? 18 : 22} />
      </Pressable>
    </View>
  );
}

// ---------- Estado vazio ----------

export function EstadoVazio({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone: NomeIcone;
  titulo: string;
  texto: string;
  acao?: { titulo: string; aoPressionar: () => void };
}) {
  return (
    <View style={estilos.vazio}>
      <View style={estilos.vazioIcone}>
        <Icone nome={icone} cor={cores.primaria} tamanho={44} />
      </View>
      <Text style={[tipo.subtitulo, { marginTop: espaco.lg, textAlign: 'center' }]}>{titulo}</Text>
      <Text style={[tipo.legenda, { marginTop: espaco.sm, textAlign: 'center', maxWidth: 280 }]}>{texto}</Text>
      {acao ? <Botao titulo={acao.titulo} aoPressionar={acao.aoPressionar} estilo={{ marginTop: espaco.xl, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

// ---------- Selo (etiqueta pequena) ----------

export function Selo({
  texto,
  variante = 'destaque',
  icone,
  estilo,
}: {
  texto: string;
  variante?: 'destaque' | 'primaria' | 'sucesso' | 'neutro';
  icone?: NomeIcone;
  estilo?: StyleProp<ViewStyle>;
}) {
  const mapa = {
    destaque: { fundo: cores.destaque, texto: cores.textoNoDestaque },
    primaria: { fundo: cores.primaria, texto: cores.textoNaPrimaria },
    sucesso: { fundo: cores.sucessoFundo, texto: cores.sucesso },
    neutro: { fundo: cores.superficie2, texto: cores.primariaEscura },
  }[variante];
  return (
    <View style={[estilos.selo, { backgroundColor: mapa.fundo }, estilo]}>
      {icone ? <Icone nome={icone} cor={mapa.texto} tamanho={12} /> : null}
      <Text style={{ color: mapa.texto, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 }}>{texto}</Text>
    </View>
  );
}

// ---------- Título de seção ----------

export function TituloSecao({
  titulo,
  acao,
  aoPressionar,
  estilo,
}: {
  titulo: string;
  acao?: string;
  aoPressionar?: () => void;
  estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[estilos.secao, estilo]}>
      <Text accessibilityRole="header" style={tipo.titulo as TextStyle}>
        {titulo}
      </Text>
      {acao && aoPressionar ? (
        <Pressable onPress={aoPressionar} accessibilityRole="button" hitSlop={8}>
          <Text style={{ color: cores.primaria, fontWeight: '700', fontSize: 14 }}>{acao}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: 54,
    borderRadius: raio.md,
    paddingHorizontal: espaco.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoConteudo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  botaoIcone: {
    width: ALVO_MINIMO,
    height: ALVO_MINIMO,
    borderRadius: ALVO_MINIMO / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotulo: { color: cores.textoSuave, fontSize: 14, fontWeight: '600', marginBottom: espaco.xs },
  campo: {
    minHeight: 52,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.lg,
    color: cores.texto,
    fontSize: 16,
  },
  erro: { color: cores.erro, fontSize: 13, marginTop: espaco.xs },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    borderRadius: raio.md,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.md,
    marginBottom: espaco.md,
  },
  qtdLinha: { flexDirection: 'row', alignItems: 'center' },
  qtdBotao: {
    backgroundColor: cores.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtdValor: {
    color: cores.texto,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
  },
  vazio: { alignItems: 'center', justifyContent: 'center', padding: espaco.xxl, flex: 1 },
  vazioIcone: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: cores.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    borderRadius: raio.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  secao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
