import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icone } from '../components/Icone';
import { PressableScale } from '../components/PressableScale';
import { useToast } from '../components/Toast';
import { Botao, EstadoVazio } from '../components/ui';
import { textoEndereco, useEnderecos } from '../context/EnderecosContext';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco, raio, sombra, tipo } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Enderecos'>;

export default function EnderecosScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const escolher = route.params?.escolher === true;
  const toast = useToast();
  const { enderecos, selecionado, selecionar, remover } = useEnderecos();

  function aoToque(id: string) {
    selecionar(id);
    if (escolher) navigation.goBack();
    else toast.mostrar('Endereço padrão atualizado', 'info');
  }

  function confirmarRemocao(id: string, apelido: string) {
    Alert.alert('Remover endereço', 'Remover “' + (apelido || 'este endereço') + '”?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => remover(id) },
    ]);
  }

  return (
    <SafeAreaView style={estilos.tela} edges={[]}>
      {enderecos.length === 0 ? (
        <EstadoVazio
          icone="location-outline"
          titulo="Nenhum endereço cadastrado"
          texto="Cadastre um endereço para receber seus pedidos em casa."
          acao={{ titulo: 'Cadastrar endereço', aoPressionar: () => navigation.navigate('EnderecoForm') }}
        />
      ) : (
        <>
          <FlatList
            data={enderecos}
            keyExtractor={(e) => e.id}
            contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}
            ListHeaderComponent={
              <Text style={[tipo.legenda, { marginBottom: espaco.xs }]}>
                {escolher ? 'Escolha onde receber este pedido.' : 'O endereço marcado é o usado nos pedidos.'}
              </Text>
            }
            renderItem={({ item }) => {
              const ativo = selecionado?.id === item.id;
              return (
                <PressableScale
                  onPress={() => aoToque(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  accessibilityLabel={(item.apelido || 'Endereço') + ', ' + textoEndereco(item)}
                  estilo={[estilos.cartao, ativo && estilos.ativo]}
                >
                  <Icone nome={ativo ? 'radio-button-on' : 'radio-button-off'} cor={ativo ? cores.primaria : cores.textoSuave} tamanho={22} />
                  <View style={{ flex: 1 }}>
                    <Text style={tipo.corpoForte}>{item.apelido || 'Endereço'}</Text>
                    <Text style={tipo.legenda}>{textoEndereco(item)}</Text>
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('EnderecoForm', { id: item.id })}
                    accessibilityRole="button"
                    accessibilityLabel={'Editar ' + (item.apelido || 'endereço')}
                    hitSlop={8}
                    style={estilos.icone}
                  >
                    <Icone nome="create-outline" cor={cores.primaria} tamanho={20} />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmarRemocao(item.id, item.apelido)}
                    accessibilityRole="button"
                    accessibilityLabel={'Remover ' + (item.apelido || 'endereço')}
                    hitSlop={8}
                    style={estilos.icone}
                  >
                    <Icone nome="trash-outline" cor={cores.erro} tamanho={20} />
                  </Pressable>
                </PressableScale>
              );
            }}
          />
          <View style={[estilos.rodape, { paddingBottom: Math.max(insets.bottom, espaco.lg) }]}>
            <Botao titulo="Novo endereço" icone="add" aoPressionar={() => navigation.navigate('EnderecoForm')} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    minHeight: 72,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: cores.borda,
    ...sombra,
  },
  ativo: { borderColor: cores.primaria, backgroundColor: cores.superficie2 },
  icone: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  rodape: { padding: espaco.lg, backgroundColor: cores.superficie, borderTopWidth: 1, borderTopColor: cores.borda },
});
