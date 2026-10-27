import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SessaoAuth } from '../types';

const CHAVE_SESSAO = 'foodtech.sessao';

/**
 * A sessão (que contém o token JWT) é guardada no armazenamento seguro do aparelho:
 * Keychain no iOS e Keystore no Android. No navegador (modo web de testes), o
 * SecureStore não existe e usamos o AsyncStorage como alternativa.
 */
export async function salvarSessao(sessao: SessaoAuth): Promise<void> {
  const json = JSON.stringify(sessao);
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(CHAVE_SESSAO, json);
  } else {
    await SecureStore.setItemAsync(CHAVE_SESSAO, json);
  }
}

export async function lerSessao(): Promise<SessaoAuth | null> {
  try {
    const json =
      Platform.OS === 'web'
        ? await AsyncStorage.getItem(CHAVE_SESSAO)
        : await SecureStore.getItemAsync(CHAVE_SESSAO);
    return json ? (JSON.parse(json) as SessaoAuth) : null;
  } catch {
    return null;
  }
}

export async function apagarSessao(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(CHAVE_SESSAO);
    } else {
      await SecureStore.deleteItemAsync(CHAVE_SESSAO);
    }
  } catch {
    // Sem sessão salva: nada a apagar.
  }
}

/** Auxiliares para dados não sensíveis (cache, carrinho, fila de pedidos). */
export async function lerJson<T>(chave: string, padrao: T): Promise<T> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

export async function gravarJson<T>(chave: string, valor: T): Promise<void> {
  try {
    await AsyncStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Falha ao gravar cache não deve derrubar o app.
  }
}

export async function removerChave(chave: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(chave);
  } catch {
    // ignora
  }
}
