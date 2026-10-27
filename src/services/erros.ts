export type CodigoErro = 'REDE' | 'NAO_AUTORIZADO' | 'HTTP' | 'VALIDACAO';

/** Erro padronizado de qualquer chamada à API (real ou simulada). */
export class ApiError extends Error {
  status: number;
  codigo: CodigoErro;

  constructor(mensagem: string, status: number, codigo: CodigoErro) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    // Necessário para que "instanceof" funcione ao compilar para ES5.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function ehErroDeRede(e: unknown): boolean {
  return e instanceof ApiError && e.codigo === 'REDE';
}

export function mensagemDeErro(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Ocorreu um erro inesperado.';
}
