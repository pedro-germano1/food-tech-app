import { useCallback, useEffect, useState } from 'react';
import { mensagemDeErro } from '../services';
import { lerCardapioEmCache, obterCardapio } from '../services/sincronizacao';
import { Produto } from '../types';

/** Carrega o cardápio: mostra o cache na hora e atualiza pela rede em seguida. */
export function useCardapio() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [copiaDe, setCopiaDe] = useState<string | null>(null); // preenchido quando vem do cache

  const carregar = useCallback(async (puxar = false) => {
    if (puxar) setAtualizando(true);
    setErro('');
    try {
      const r = await obterCardapio();
      setProdutos(r.dados);
      setCopiaDe(r.origem === 'cache' ? r.atualizadoEm : null);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    lerCardapioEmCache().then((cache) => {
      if (ativo && cache) {
        setProdutos(cache);
        setCarregando(false);
      }
    });
    carregar();
    return () => {
      ativo = false;
    };
  }, [carregar]);

  return { produtos, carregando, atualizando, erro, copiaDe, carregar };
}
