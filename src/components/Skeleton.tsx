import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, View, ViewStyle } from 'react-native';
import { cores, raio } from '../theme';

/** Bloco cinza pulsante usado enquanto o conteúdo carrega. */
export function Skeleton({
  largura = '100%',
  altura = 16,
  arredondamento = raio.sm,
  estilo,
}: {
  largura?: DimensionValue;
  altura?: number;
  arredondamento?: number;
  estilo?: StyleProp<ViewStyle>;
}) {
  const opacidade = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacidade]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ width: largura, height: altura, borderRadius: arredondamento, backgroundColor: cores.borda, opacity: opacidade }, estilo]}
    />
  );
}

/** Esqueleto de um card de produto (usado na Home e no Cardápio). */
export function SkeletonCardProduto() {
  return (
    <View style={{ backgroundColor: cores.superficie, borderRadius: raio.lg, padding: 12, borderWidth: 1, borderColor: cores.borda }}>
      <Skeleton altura={110} arredondamento={raio.md} />
      <Skeleton altura={14} largura="80%" estilo={{ marginTop: 12 }} />
      <Skeleton altura={12} largura="55%" estilo={{ marginTop: 8 }} />
      <Skeleton altura={18} largura="40%" estilo={{ marginTop: 12 }} />
    </View>
  );
}
