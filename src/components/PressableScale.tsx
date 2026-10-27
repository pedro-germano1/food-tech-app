import React, { useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  estilo?: StyleProp<ViewStyle>;
  escala?: number;
  children: React.ReactNode;
}

// Propriedades que posicionam/dimensionam o componente dentro do pai. Elas ficam no contêiner
// externo (que também recebe a animação); o visual (fundo, borda, padding...) fica no Pressable.
const CHAVES_DE_LAYOUT = new Set([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'alignSelf', 'position', 'top', 'left', 'right', 'bottom', 'zIndex', 'aspectRatio',
]);

function separar(estilo: StyleProp<ViewStyle>): { layout: ViewStyle; visual: ViewStyle } {
  const plano = (StyleSheet.flatten(estilo) || {}) as Record<string, unknown>;
  const layout: Record<string, unknown> = {};
  const visual: Record<string, unknown> = {};
  for (const k of Object.keys(plano)) (CHAVES_DE_LAYOUT.has(k) ? layout : visual)[k] = plano[k];
  return { layout: layout as ViewStyle, visual: visual as ViewStyle };
}

/** Pressable com leve redução de escala ao toque (feedback tátil visual). */
export function PressableScale({ estilo, escala = 0.97, children, onPressIn, onPressOut, ...resto }: Props) {
  const valor = useRef(new Animated.Value(1)).current;
  const { layout, visual } = separar(estilo);

  function animar(para: number) {
    Animated.spring(valor, { toValue: para, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  return (
    <Animated.View style={[layout, { transform: [{ scale: valor }] }]}>
      <Pressable
        {...resto}
        style={[visual, { flexGrow: 1, alignSelf: 'stretch' }]}
        onPressIn={(e: GestureResponderEvent) => {
          animar(escala);
          onPressIn?.(e);
        }}
        onPressOut={(e: GestureResponderEvent) => {
          animar(1);
          onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
