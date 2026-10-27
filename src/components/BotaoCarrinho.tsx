import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCarrinho } from '../context/CarrinhoContext';
import { AppStackParamList } from '../navigation/tipos';
import { cores } from '../theme';
import { BotaoIcone } from './ui';

/** Ícone do carrinho com contador; dá um pulinho quando a quantidade muda. */
export function BotaoCarrinho({ fundo = cores.superficie, cor = cores.texto }: { fundo?: string; cor?: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { quantidadeTotal } = useCarrinho();
  const escala = useRef(new Animated.Value(1)).current;
  const anterior = useRef(quantidadeTotal);

  useEffect(() => {
    if (quantidadeTotal !== anterior.current) {
      anterior.current = quantidadeTotal;
      Animated.sequence([
        Animated.timing(escala, { toValue: 1.18, duration: 120, useNativeDriver: true }),
        Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
      ]).start();
    }
  }, [quantidadeTotal, escala]);

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <BotaoIcone
        icone="bag-handle-outline"
        rotulo={quantidadeTotal > 0 ? 'Abrir carrinho, ' + quantidadeTotal + (quantidadeTotal === 1 ? ' item' : ' itens') : 'Abrir carrinho, vazio'}
        aoPressionar={() => navigation.navigate('Carrinho')}
        fundo={fundo}
        cor={cor}
      />
      {quantidadeTotal > 0 ? (
        <View style={estilos.badge} pointerEvents="none">
          <Text style={estilos.badgeTexto}>{quantidadeTotal > 99 ? '99+' : quantidadeTotal}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: cores.destaque,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: { color: cores.textoNoDestaque, fontSize: 11, fontWeight: '800' },
});
