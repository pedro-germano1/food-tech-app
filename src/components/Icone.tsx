import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { cores } from '../theme';

export type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

/** Único ponto de uso de ícones: mesma biblioteca (Ionicons), tamanhos e cor padronizados. */
export function Icone({
  nome,
  tamanho = 22,
  cor = cores.texto,
}: {
  nome: NomeIcone;
  tamanho?: number;
  cor?: string;
}) {
  return <Ionicons name={nome} size={tamanho} color={cor} accessibilityElementsHidden importantForAccessibility="no" />;
}
