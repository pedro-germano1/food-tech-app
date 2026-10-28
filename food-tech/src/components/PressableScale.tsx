import React, { useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  estilo?: StyleProp<ViewStyle>;
  escala?: number;
  children: React.ReactNode;
}

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable com leve redução de escala ao toque (feedback tátil visual).
 * Um único elemento recebe o estilo e a animação, para que o layout (largura, margem,
 * alinhamento) se comporte igual no iPhone, no Android e no navegador.
 */
export function PressableScale({ estilo, escala = 0.97, children, onPressIn, onPressOut, ...resto }: Props) {
  const valor = useRef(new Animated.Value(1)).current;

  function animar(para: number) {
    Animated.spring(valor, { toValue: para, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  return (
    <PressableAnimado
      {...resto}
      style={[estilo, { transform: [{ scale: valor }] }]}
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
    </PressableAnimado>
  );
}