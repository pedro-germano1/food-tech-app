import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso, Botao, CampoTexto } from '../components/ui';
import { config } from '../config';
import { useAuth } from '../context/AuthContext';
import { mensagemDeErro } from '../services';
import { cores, espaco, fonte, raio, sombra } from '../theme';
import { emailValido } from '../utils/formatar';
import { AuthStackParamList } from '../navigation/tipos';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { entrar } = useAuth();
  const [email, setEmail] = useState(config.USAR_MOCK ? 'demo@foodtech.com' : '');
  const [senha, setSenha] = useState(config.USAR_MOCK ? '123456' : '');
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function aoEntrar() {
    setErroGeral('');
    const eEmail = emailValido(email) ? '' : 'Digite um e-mail válido.';
    const eSenha = senha.length >= 6 ? '' : 'A senha tem pelo menos 6 caracteres.';
    setErroEmail(eEmail);
    setErroSenha(eSenha);
    if (eEmail || eSenha) return;

    setCarregando(true);
    try {
      await entrar(email, senha);
      // O redirecionamento para o app acontece automaticamente quando a sessão é criada.
    } catch (e) {
      setErroGeral(mensagemDeErro(e));
      setCarregando(false);
    }
  }

  return (
    <View style={estilos.tela}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Faixa azul da marca: a logo tem brilho e fica melhor em fundo escuro */}
          <SafeAreaView edges={['top']} style={estilos.hero}>
            <Image
              source={require('../../assets/logo.png')}
              style={estilos.logo}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel={'Logotipo ' + config.NOME_LOJA}
            />
            <Text style={estilos.slogan}>Seu pedido, do app até a sua porta.</Text>
          </SafeAreaView>

          <View style={estilos.folha}>
            <Text accessibilityRole="header" style={[fonte.titulo, { marginBottom: espaco.lg }]}>
              Entrar
            </Text>

            {erroGeral ? <Aviso tipo="erro" texto={erroGeral} /> : null}

            <CampoTexto
              rotulo="E-mail"
              value={email}
              onChangeText={setEmail}
              erro={erroEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              placeholder="voce@email.com"
            />
            <CampoTexto
              rotulo="Senha"
              value={senha}
              onChangeText={setSenha}
              erro={erroSenha}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              placeholder="Mínimo de 6 caracteres"
            />

            <Botao titulo="Entrar" aoPressionar={aoEntrar} carregando={carregando} />
            <Botao
              titulo="Criar conta"
              variante="secundario"
              aoPressionar={() => navigation.navigate('Registro')}
              estilo={{ marginTop: espaco.md }}
            />

            {config.USAR_MOCK ? (
              <Text style={[fonte.suave, { textAlign: 'center', marginTop: espaco.xl }]}>
                Modo demonstração: conta de teste já preenchida.
              </Text>
            ) : null}

            <Text style={estilos.credito}>Desenvolvido por {config.AUTOR}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.marca },
  hero: {
    backgroundColor: cores.marca,
    alignItems: 'center',
    paddingHorizontal: espaco.xl,
    paddingTop: espaco.lg,
    paddingBottom: espaco.xxl + espaco.md,
  },
  logo: { width: 168, height: 146 },
  slogan: { color: cores.azulClaro, fontSize: 15, fontWeight: '600', marginTop: espaco.md },
  folha: {
    flex: 1,
    backgroundColor: cores.fundo,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -espaco.xl,
    padding: espaco.xl,
    paddingTop: espaco.xxl,
    ...sombra,
  },
  credito: { color: cores.textoSuave, fontSize: 12, textAlign: 'center', marginTop: espaco.xl },
});
