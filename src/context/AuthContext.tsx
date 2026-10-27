import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DadosRegistro, SessaoAuth, Usuario } from '../types';
import { api } from '../services';
import { apagarSessao, lerSessao, salvarSessao } from '../services/armazenamento';
import { definirToken, registrarAoNaoAutorizado } from '../services/tokenAtual';

interface AuthContextoValor {
  usuario: Usuario | null;
  carregando: boolean; // true enquanto o app verifica se já existe uma sessão salva
  entrar(email: string, senha: string): Promise<void>;
  cadastrar(dados: DadosRegistro): Promise<void>;
  sair(): Promise<void>;
}

const AuthContext = createContext<AuthContextoValor | undefined>(undefined);

function sessaoValida(s: SessaoAuth): boolean {
  return new Date(s.expiraEm).getTime() > Date.now();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const aplicarSessao = useCallback(async (sessao: SessaoAuth) => {
    definirToken(sessao.token);
    await salvarSessao(sessao);
    setUsuario(sessao.usuario);
  }, []);

  const sair = useCallback(async () => {
    definirToken(null);
    await apagarSessao();
    setUsuario(null);
  }, []);

  // Ao abrir o app: restaura a sessão salva, se ainda estiver válida.
  useEffect(() => {
    let ativo = true;
    (async () => {
      const salva = await lerSessao();
      if (!ativo) return;
      if (salva && sessaoValida(salva)) {
        definirToken(salva.token);
        setUsuario(salva.usuario);
      } else if (salva) {
        await apagarSessao();
      }
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Se a API responder 401 em qualquer tela, encerra a sessão e volta ao login.
  useEffect(() => {
    registrarAoNaoAutorizado(() => {
      sair();
    });
    return () => registrarAoNaoAutorizado(null);
  }, [sair]);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const sessao = await api.login(email.trim(), senha);
      await aplicarSessao(sessao);
    },
    [aplicarSessao]
  );

  const cadastrar = useCallback(
    async (dados: DadosRegistro) => {
      const sessao = await api.registrar(dados);
      await aplicarSessao(sessao);
    },
    [aplicarSessao]
  );

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, cadastrar, sair }),
    [usuario, carregando, entrar, cadastrar, sair]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextoValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
