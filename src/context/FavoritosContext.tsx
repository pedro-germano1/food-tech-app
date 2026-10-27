import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { gravarJson, lerJson } from '../services/armazenamento';
import { useAuth } from './AuthContext';

interface FavoritosValor {
  ids: number[];
  ehFavorito(produtoId: number): boolean;
  alternar(produtoId: number): boolean; // devolve true se passou a ser favorito
}

const FavoritosContext = createContext<FavoritosValor | undefined>(undefined);

/** Produtos favoritos, guardados no aparelho e separados por usuário. */
export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const chave = 'favoritos.' + (usuario ? usuario.id : 0);
  const [ids, setIds] = useState<number[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setCarregado(false);
    lerJson<number[]>(chave, []).then((salvo) => {
      setIds(Array.isArray(salvo) ? salvo : []);
      setCarregado(true);
    });
  }, [chave]);

  useEffect(() => {
    if (carregado) gravarJson(chave, ids);
  }, [ids, carregado, chave]);

  const ehFavorito = useCallback((id: number) => ids.includes(id), [ids]);

  const alternar = useCallback(
    (id: number) => {
      const passaASer = !ids.includes(id);
      setIds((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
      return passaASer;
    },
    [ids]
  );

  const valor = useMemo(() => ({ ids, ehFavorito, alternar }), [ids, ehFavorito, alternar]);
  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos(): FavoritosValor {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos deve ser usado dentro de <FavoritosProvider>');
  return ctx;
}
