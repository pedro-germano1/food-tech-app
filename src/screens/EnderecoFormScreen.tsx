import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../components/Toast';
import { Botao, CampoTexto } from '../components/ui';
import { useEnderecos } from '../context/EnderecosContext';
import { AppStackParamList } from '../navigation/tipos';
import { cores, espaco } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EnderecoForm'>;

export default function EnderecoFormScreen({ navigation, route }: Props) {
  const id = route.params?.id;
  const toast = useToast();
  const { enderecos, salvar } = useEnderecos();
  const existente = id ? enderecos.find((e) => e.id === id) : undefined;

  const [apelido, setApelido] = useState(existente?.apelido ?? '');
  const [logradouro, setLogradouro] = useState(existente?.logradouro ?? '');
  const [numero, setNumero] = useState(existente?.numero ?? '');
  const [bairro, setBairro] = useState(existente?.bairro ?? '');
  const [complemento, setComplemento] = useState(existente?.complemento ?? '');
  const [erros, setErros] = useState<Record<string, string>>({});

  function aoSalvar() {
    const novos: Record<string, string> = {};
    if (logradouro.trim().length < 3) novos.logradouro = 'Informe a rua ou avenida.';
    if (numero.trim().length < 1) novos.numero = 'Informe o número (ou S/N).';
    if (bairro.trim().length < 2) novos.bairro = 'Informe o bairro.';
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    salvar(
      {
        apelido: apelido.trim() || 'Casa',
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        bairro: bairro.trim(),
        complemento: complemento.trim(),
      },
      id
    );
    toast.mostrar(id ? 'Endereço atualizado' : 'Endereço salvo');
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: espaco.lg }} keyboardShouldPersistTaps="handled">
          <CampoTexto rotulo="Nome do endereço" value={apelido} onChangeText={setApelido} placeholder="Casa, Trabalho…" maxLength={20} />
          <CampoTexto rotulo="Rua / Avenida" value={logradouro} onChangeText={setLogradouro} erro={erros.logradouro} autoComplete="street-address" textContentType="streetAddressLine1" />
          <CampoTexto rotulo="Número" value={numero} onChangeText={setNumero} erro={erros.numero} maxLength={10} />
          <CampoTexto rotulo="Bairro" value={bairro} onChangeText={setBairro} erro={erros.bairro} />
          <CampoTexto rotulo="Complemento (opcional)" value={complemento} onChangeText={setComplemento} placeholder="Apto, bloco, referência" maxLength={40} />
          <Botao titulo="Salvar endereço" icone="checkmark" aoPressionar={aoSalvar} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
