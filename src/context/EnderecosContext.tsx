import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { gravarJson, lerJson } from '../services/armazenamento';
import { Endereco } from '../types';
import { novaChave } from '../utils/formatar';
import { useAuth } from './AuthContext';

interface Salvo {
  lista: Endereco[];
  selecionadoId: string | null;
}

interface EnderecosValor {
  enderecos: Endereco[];
  selecionado: Endereco | null;
  carregado: boolean;
  salvar(dados: Omit<Endereco, 'id'>, id?: string): Endereco;
  remover(id: string): void;
  selecionar(id: string): void;
}

const EnderecosContext = createContext<EnderecosValor | undefined>(undefined);

export function textoEndereco(e: Endereco): string {
  const base = e.logradouro.trim() + ', ' + e.numero.trim() + ' - ' + e.bairro.trim();
  return e.complemento.trim() ? base + ' (' + e.complemento.trim() + ')' : base;
}

/** Endereços de entrega, guardados no aparelho e separados por usuário. */
export function EnderecosProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const chave = 'enderecos.' + (usuario ? usuario.id : 0);
  const [estado, setEstado] = useState<Salvo>({ lista: [], selecionadoId: null });
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setCarregado(false);
    lerJson<Salvo>(chave, { lista: [], selecionadoId: null }).then((salvo) => {
      setEstado(salvo && Array.isArray(salvo.lista) ? salvo : { lista: [], selecionadoId: null });
      setCarregado(true);
    });
  }, [chave]);

  useEffect(() => {
    if (carregado) gravarJson(chave, estado);
  }, [estado, carregado, chave]);

  const salvar = useCallback((dados: Omit<Endereco, 'id'>, id?: string): Endereco => {
    const endereco: Endereco = { ...dados, id: id ?? novaChave() };
    setEstado((atual) => {
      const existe = atual.lista.some((e) => e.id === endereco.id);
      return {
        lista: existe ? atual.lista.map((e) => (e.id === endereco.id ? endereco : e)) : [...atual.lista, endereco],
        // O endereço recém-criado já vem selecionado; editar não troca a seleção.
        selecionadoId: existe ? atual.selecionadoId : endereco.id,
      };
    });
    return endereco;
  }, []);

  const remover = useCallback((id: string) => {
    setEstado((atual) => {
      const lista = atual.lista.filter((e) => e.id !== id);
      const selecionadoId = atual.selecionadoId === id ? (lista[0] ? lista[0].id : null) : atual.selecionadoId;
      return { lista, selecionadoId };
    });
  }, []);

  const selecionar = useCallback((id: string) => {
    setEstado((atual) => ({ ...atual, selecionadoId: id }));
  }, []);

  const valor = useMemo<EnderecosValor>(() => {
    const selecionado = estado.lista.find((e) => e.id === estado.selecionadoId) ?? estado.lista[0] ?? null;
    return { enderecos: estado.lista, selecionado, carregado, salvar, remover, selecionar };
  }, [estado, carregado, salvar, remover, selecionar]);

  return <EnderecosContext.Provider value={valor}>{children}</EnderecosContext.Provider>;
}

export function useEnderecos(): EnderecosValor {
  const ctx = useContext(EnderecosContext);
  if (!ctx) throw new Error('useEnderecos deve ser usado dentro de <EnderecosProvider>');
  return ctx;
}
