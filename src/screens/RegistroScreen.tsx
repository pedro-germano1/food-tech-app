import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Botao, CampoTexto } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { mensagemDeErro } from '../services';
import { cores, espaco, fonte } from '../theme';
import { emailValido } from '../utils/formatar';
import { AuthStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AuthStackParamList, 'Registro'>;

export default function RegistroScreen({ navigation }: Props) {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoCadastrar() {
    setErroGeral('');
    const novos: Record<string, string> = {};
    if (nome.trim().length < 3) novos.nome = 'Informe seu nome completo.';
    if (!emailValido(email)) novos.email = 'Digite um e-mail válido.';
    if (senha.length < 6) novos.senha = 'A senha tem pelo menos 6 caracteres.';
    if (confirmacao !== senha) novos.confirmacao = 'As senhas não conferem.';
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setCarregando(true);
    try {
      await cadastrar({ nome, email, senha });
    } catch (e) {
      setErroGeral(mensagemDeErro(e));
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={[fonte.suave, { marginBottom: espaco.xl }]}>
            Crie sua conta para fazer pedidos e acompanhar a entrega.
          </Text>

          {erroGeral ? <Aviso tipo="erro" texto={erroGeral} /> : null}

          <CampoTexto rotulo="Nome completo" value={nome} onChangeText={setNome} erro={erros.nome} autoComplete="name" textContentType="name" />
          <CampoTexto
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            erro={erros.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <CampoTexto rotulo="Senha" value={senha} onChangeText={setSenha} erro={erros.senha} secureTextEntry />
          <CampoTexto
            rotulo="Confirmar senha"
            value={confirmacao}
            onChangeText={setConfirmacao}
            erro={erros.confirmacao}
            secureTextEntry
          />

          <Botao titulo="Criar conta" aoPressionar={aoCadastrar} carregando={carregando} />
          <Botao
            titulo="Já tenho conta"
            variante="secundario"
            aoPressionar={() => navigation.goBack()}
            estilo={{ marginTop: espaco.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.xl },
});
