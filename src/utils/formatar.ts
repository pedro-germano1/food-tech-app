export function moeda(valor: number): string {
  return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function doisDigitos(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export function hora(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return doisDigitos(d.getHours()) + ':' + doisDigitos(d.getMinutes());
}

export function horaCompleta(d: Date): string {
  return hora(d) + ':' + doisDigitos(d.getSeconds());
}

export function dataHora(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return (
    doisDigitos(d.getDate()) + '/' + doisDigitos(d.getMonth() + 1) + ' às ' + hora(d)
  );
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const ROTULO_STATUS: Record<string, string> = {
  Recebido: 'Pedido recebido',
  Confirmado: 'Pedido confirmado',
  EmPreparo: 'Em preparo',
  SaiuParaEntrega: 'Saiu para entrega',
  ProntoParaRetirada: 'Pronto para retirada',
  Entregue: 'Concluído',
  Cancelado: 'Cancelado',
};

export const ROTULO_PAGAMENTO: Record<string, string> = {
  Pix: 'Pix',
  Cartao: 'Cartão',
  Dinheiro: 'Dinheiro',
};

export const ROTULO_MODALIDADE: Record<string, string> = {
  Entrega: 'Entrega',
  Retirada: 'Retirada no balcão',
};

/** Pedido encerrado (não precisa mais de acompanhamento). */
export function pedidoFinalizado(status: string): boolean {
  return status === 'Entregue' || status === 'Cancelado';
}

export function primeiroNome(nome: string | undefined): string {
  if (!nome) return '';
  return nome.trim().split(/\s+/)[0];
}

export function saudacao(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Remove acentos e põe em minúsculas, para a busca ignorar "á" x "a". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function novaChave(): string {
  return (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
  );
}
