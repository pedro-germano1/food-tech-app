import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, espaco, raio, sombraMedia } from '../theme';
import { Icone } from './Icone';

type Tipo = 'sucesso' | 'info' | 'erro';

interface ToastValor {
  mostrar(texto: string, tipo?: Tipo): void;
}

const ToastContext = createContext<ToastValor | undefined>(undefined);

/** Mensagem rápida no topo da tela, some sozinha. Não bloqueia o uso (diferente de Alert). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<{ texto: string; tipo: Tipo; id: number } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback(
    (texto: string, tipo: Tipo = 'sucesso') => {
      if (timer.current) clearTimeout(timer.current);
      setMsg({ texto, tipo, id: Date.now() });
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null));
      }, 2400);
    },
    [anim]
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Valor estável: quem usa o toast não é re-renderizado a cada mensagem exibida.
  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  const cor = msg?.tipo === 'erro' ? cores.erro : msg?.tipo === 'info' ? cores.primaria : cores.sucesso;
  const icone = msg?.tipo === 'erro' ? 'alert-circle' : msg?.tipo === 'info' ? 'information-circle' : 'checkmark-circle';

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {msg ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            estilos.caixa,
            {
              top: insets.top + espaco.sm,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
            },
          ]}
        >
          <View style={[estilos.faixa, { backgroundColor: cor }]} />
          <Icone nome={icone} cor={cor} tamanho={22} />
          <Text style={estilos.texto} numberOfLines={2}>
            {msg.texto}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValor {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

const estilos = StyleSheet.create({
  caixa: {
    position: 'absolute',
    left: espaco.lg,
    right: espaco.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.lg,
    overflow: 'hidden',
    zIndex: 1000,
    ...sombraMedia,
  },
  faixa: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  texto: { flex: 1, color: cores.texto, fontSize: 14, fontWeight: '600' },
});
