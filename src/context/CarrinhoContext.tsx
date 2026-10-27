import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { chaveItem, personalizacaoInicial, precoUnitario } from '../domain/preco';
import { ItemCarrinho, Personalizacao, Produto } from '../types';
import { gravarJson, lerJson } from '../services/armazenamento';

const CHAVE_CARRINHO = 'carrinho.itens';

interface CarrinhoValor {
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  /** Soma do que será cobrado pelos itens (já com promoções), sem taxa de entrega. */
  totalItens: number;
  adicionar(produto: Produto, quantidade?: number, personalizacao?: Personalizacao): void;
  /** Troca a personalização e a quantidade de um item já no carrinho. */
  atualizarItem(chave: string, personalizacao: Personalizacao, quantidade: number): void;
  alterarQuantidade(chave: string, delta: number): void;
  remover(chave: string): void;
  limpar(): void;
}

const CarrinhoContext = createContext<CarrinhoValor | undefined>(undefined);

/** Descarta itens gravados em formato antigo (versões anteriores do app). */
function itemValido(i: ItemCarrinho): boolean {
  return !!i && !!i.produto && !!i.personalizacao && typeof i.quantidade === 'number';
}

export function CarrinhoProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  // O carrinho sobrevive ao fechamento do app.
  useEffect(() => {
    lerJson<ItemCarrinho[]>(CHAVE_CARRINHO, []).then((salvo) => {
      setItens(Array.isArray(salvo) ? salvo.filter(itemValido) : []);
      setCarregado(true);
    });
  }, []);

  useEffect(() => {
    if (carregado) gravarJson(CHAVE_CARRINHO, itens);
  }, [itens, carregado]);

  const adicionar = useCallback(
    (produto: Produto, quantidade = 1, personalizacao?: Personalizacao) => {
      const pers = personalizacao ?? personalizacaoInicial(produto);
      const chave = chaveItem(produto, pers);
      setItens((atual) => {
        const existe = atual.find((i) => i.chave === chave);
        if (existe) {
          return atual.map((i) =>
            i.chave === chave ? { ...i, quantidade: Math.min(20, i.quantidade + quantidade) } : i
          );
        }
        return [...atual, { chave, produto, quantidade, personalizacao: pers }];
      });
    },
    []
  );

  const atualizarItem = useCallback((chaveAntiga: string, pers: Personalizacao, quantidade: number) => {
    setItens((atual) => {
      const alvo = atual.find((i) => i.chave === chaveAntiga);
      if (!alvo) return atual;
      const novaChave = chaveItem(alvo.produto, pers);
      const semAlvo = atual.filter((i) => i.chave !== chaveAntiga);
      const igual = semAlvo.find((i) => i.chave === novaChave);
      if (igual) {
        // A edição deixou este item idêntico a outro: junta as quantidades.
        return semAlvo.map((i) =>
          i.chave === novaChave ? { ...i, quantidade: Math.min(20, i.quantidade + quantidade) } : i
        );
      }
      // Mantém a posição original na lista.
      return atual.map((i) =>
        i.chave === chaveAntiga ? { ...i, chave: novaChave, personalizacao: pers, quantidade } : i
      );
    });
  }, []);

  const alterarQuantidade = useCallback((chave: string, delta: number) => {
    setItens((atual) =>
      atual
        .map((i) =>
          i.chave === chave ? { ...i, quantidade: Math.min(20, i.quantidade + delta) } : i
        )
        .filter((i) => i.quantidade > 0)
    );
  }, []);

  const remover = useCallback((chave: string) => {
    setItens((atual) => atual.filter((i) => i.chave !== chave));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const valor = useMemo<CarrinhoValor>(() => {
    const quantidadeTotal = itens.reduce((s, i) => s + i.quantidade, 0);
    const totalItens =
      Math.round(
        itens.reduce((s, i) => s + precoUnitario(i.produto, i.personalizacao) * i.quantidade, 0) * 100
      ) / 100;
    return {
      itens,
      quantidadeTotal,
      totalItens,
      adicionar,
      atualizarItem,
      alterarQuantidade,
      remover,
      limpar,
    };
  }, [itens, adicionar, atualizarItem, alterarQuantidade, remover, limpar]);

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho(): CarrinhoValor {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de <CarrinhoProvider>');
  return ctx;
}
