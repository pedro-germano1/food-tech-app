import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icone, NomeIcone } from '../components/Icone';
import { PressableScale } from '../components/PressableScale';
import { Botao } from '../components/ui';
import { config } from '../config';
import { useAuth } from '../context/AuthContext';
import { useEnderecos } from '../context/EnderecosContext';
import { useFavoritos } from '../context/FavoritosContext';
import { useSincronizacao } from '../context/SincronizacaoContext';
import { definirOfflineSimulado, estaOfflineSimulado } from '../services/apiMock';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco, raio, sombra, tipo } from '../theme';
import { horaCompleta } from '../utils/formatar';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function PerfilScreen() {
  const navigation = useNavigation<Nav>();
  const { usuario, sair } = useAuth();
  const { enderecos } = useEnderecos();
  const { ids: favoritos } = useFavoritos();
  const { pendentes, sincronizando, ultimaSincronizacao, sincronizarAgora } = useSincronizacao();
  const [offline, setOffline] = useState(estaOfflineSimulado());

  function alternarOffline(valor: boolean) {
    definirOfflineSimulado(valor);
    setOffline(valor);
  }

  function confirmarSaida() {
    const aviso =
      pendentes.length > 0
        ? 'Você tem ' + pendentes.length + ' pedido(s) aguardando envio. Eles continuam salvos e serão enviados quando você entrar de novo com esta conta.'
        : 'Deseja encerrar a sessão neste aparelho?';
    Alert.alert('Sair da conta', aviso, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => sair() },
    ]);
  }

  const inicial = usuario ? usuario.nome.trim().charAt(0).toUpperCase() : '?';

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, paddingBottom: espaco.xxl }} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[tipo.display, { marginBottom: espaco.lg }]}>
          Perfil
        </Text>

        {/* Dados pessoais */}
        <View style={estilos.cabecalho}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>{inicial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={tipo.subtitulo} numberOfLines={1}>
              {usuario ? usuario.nome : ''}
            </Text>
            <Text style={tipo.legenda} numberOfLines={1}>
              {usuario ? usuario.email : ''}
            </Text>
          </View>
        </View>

        <Rotulo texto="Minha conta" />
        <View style={estilos.grupo}>
          <Linha
            icone="location"
            titulo="Endereços"
            detalhe={enderecos.length === 0 ? 'Nenhum cadastrado' : enderecos.length === 1 ? '1 endereço' : enderecos.length + ' endereços'}
            aoPressionar={() => navigation.navigate('Enderecos')}
          />
          <Linha
            icone="heart"
            titulo="Favoritos"
            detalhe={favoritos.length === 0 ? 'Nenhum ainda' : favoritos.length === 1 ? '1 produto' : favoritos.length + ' produtos'}
            aoPressionar={() => navigation.navigate('Favoritos')}
          />
          <Linha
            icone="receipt"
            titulo="Histórico de pedidos"
            detalhe="Ver e pedir de novo"
            ultima
            aoPressionar={() => navigation.navigate('Tabs', { screen: 'Pedidos' })}
          />
        </View>

        <Rotulo texto="Sincronização" />
        <View style={estilos.grupo}>
          <View style={estilos.linhaInfo}>
            <Text style={tipo.corpo}>Pedidos aguardando envio</Text>
            <Text style={[tipo.corpoForte, { color: pendentes.length ? cores.alerta : cores.sucesso }]}>{pendentes.length}</Text>
          </View>
          <View style={[estilos.linhaInfo, { borderBottomWidth: 0 }]}>
            <Text style={tipo.corpo}>Último envio</Text>
            <Text style={tipo.legenda}>{ultimaSincronizacao ? horaCompleta(ultimaSincronizacao) : '—'}</Text>
          </View>
        </View>
        <Botao
          titulo={sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
          variante="secundario"
          icone="sync"
          carregando={sincronizando}
          aoPressionar={sincronizarAgora}
          estilo={{ marginTop: espaco.md }}
        />

        {config.USAR_MOCK ? (
          <>
            <Rotulo texto="Modo demonstração" />
            <View style={estilos.grupo}>
              <View style={[estilos.linhaInfo, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1, paddingRight: espaco.md }}>
                  <Text style={tipo.corpoForte}>Simular sem internet</Text>
                  <Text style={tipo.legenda}>Ative, faça um pedido e depois desative: o app envia o pedido sozinho.</Text>
                </View>
                <Switch
                  value={offline}
                  onValueChange={alternarOffline}
                  accessibilityLabel="Simular sem internet"
                  trackColor={{ true: cores.primaria, false: cores.borda }}
                />
              </View>
            </View>
          </>
        ) : null}

        <Botao titulo="Sair da conta" variante="perigo" icone="log-out-outline" aoPressionar={confirmarSaida} estilo={{ marginTop: espaco.xxl }} />

        <Text style={[tipo.legenda, { textAlign: 'center', marginTop: espaco.xl, fontSize: 12 }]}>
          {config.NOME_LOJA} · Desenvolvido por {config.AUTOR}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Rotulo({ texto }: { texto: string }) {
  return (
    <Text accessibilityRole="header" style={[tipo.rotulo, { marginTop: espaco.xl, marginBottom: espaco.sm, marginLeft: 4 }]}>
      {texto}
    </Text>
  );
}

function Linha({
  icone,
  titulo,
  detalhe,
  aoPressionar,
  ultima,
}: {
  icone: NomeIcone;
  titulo: string;
  detalhe: string;
  aoPressionar: () => void;
  ultima?: boolean;
}) {
  return (
    <PressableScale
      onPress={aoPressionar}
      escala={0.99}
      accessibilityRole="button"
      accessibilityLabel={titulo + ', ' + detalhe}
      estilo={[estilos.linhaMenu, ultima && { borderBottomWidth: 0 }]}
    >
      <View style={estilos.icone}>
        <Icone nome={icone} cor={cores.primaria} tamanho={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tipo.corpoForte}>{titulo}</Text>
        <Text style={tipo.legenda}>{detalhe}</Text>
      </View>
      <Icone nome="chevron-forward" cor={cores.textoSuave} tamanho={18} />
    </PressableScale>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.lg,
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espaco.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    ...sombra,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: cores.branco, fontSize: 26, fontWeight: '800' },
  grupo: { backgroundColor: cores.superficie, borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda, paddingHorizontal: espaco.lg, ...sombra },
  linhaMenu: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, minHeight: 64, borderBottomWidth: 1, borderBottomColor: cores.borda },
  icone: { width: 38, height: 38, borderRadius: 19, backgroundColor: cores.superficie2, alignItems: 'center', justifyContent: 'center' },
  linhaInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: cores.borda },
});
