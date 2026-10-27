import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components/Toast';
import { AuthProvider } from './src/context/AuthContext';
import { CarrinhoProvider } from './src/context/CarrinhoContext';
import { EnderecosProvider } from './src/context/EnderecosContext';
import { FavoritosProvider } from './src/context/FavoritosContext';
import Navegacao from './src/navigation/Navegacao';

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <CarrinhoProvider>
            <EnderecosProvider>
              <FavoritosProvider>
                <StatusBar style="dark" />
                <Navegacao />
              </FavoritosProvider>
            </EnderecosProvider>
          </CarrinhoProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
