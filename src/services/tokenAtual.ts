/**
 * Guarda em memória o token da sessão atual e a ação a executar quando a API
 * responder 401 (token expirado ou inválido). É preenchido pelo AuthContext.
 */
let token: string | null = null;
let aoNaoAutorizado: (() => void) | null = null;

export function definirToken(novo: string | null): void {
  token = novo;
}

export function obterToken(): string | null {
  return token;
}

export function registrarAoNaoAutorizado(fn: (() => void) | null): void {
  aoNaoAutorizado = fn;
}

export function dispararNaoAutorizado(): void {
  if (aoNaoAutorizado) aoNaoAutorizado();
}
