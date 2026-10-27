import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, tipo } from '../theme';
import { Icone, NomeIcone } from './Icone';

/** Tela cheia de confirmação (check animado). Chama `aoTerminar` depois de ~1,7 s. */
export function AnimacaoSucesso({
  titulo,
  texto,
  icone = 'checkmark',
  cor = cores.sucesso,
  aoTerminar,
}: {
  titulo: string;
  texto: string;
  icone?: NomeIcone;
  cor?: string;
  aoTerminar: () => void;
}) {
  const fundo = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.3)).current;
  const textoOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fundo, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 14 }),
      Animated.timing(textoOp, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(aoTerminar, 1900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[estilos.tela, { opacity: fundo }]} accessibilityViewIsModal accessibilityLiveRegion="assertive">
      <Animated.View style={[estilos.circulo, { backgroundColor: cor, transform: [{ scale: escala }] }]}>
        <Icone nome={icone} cor={cores.branco} tamanho={64} />
      </Animated.View>
      <Animated.View style={{ opacity: textoOp, alignItems: 'center' }}>
        <Text style={[tipo.display, { textAlign: 'center', marginTop: espaco.xl }]}>{titulo}</Text>
        <Text style={[tipo.corpo, { color: cores.textoSuave, textAlign: 'center', marginTop: espaco.sm, maxWidth: 300 }]}>{texto}</Text>
      </Animated.View>
      <View />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaco.xl,
    zIndex: 100,
  },
  circulo: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
});
