import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Design system Food Tech.
 *
 * Paleta extraída do logotipo: azul-marinho (fundo da marca), azul de ação, branco e,
 * em doses pequenas, o amarelo do pão (usado só para destacar promoções).
 * Contraste conferido (WCAG 2.1): texto sobre fundo claro ≈ 15:1, branco sobre azul de ação ≈ 4,7:1.
 */
export const cores = {
  marca: '#0A1F44',
  marcaClara: '#16346E',
  fundo: '#F4F7FC',
  superficie: '#FFFFFF',
  superficie2: '#E8F1FD',
  borda: '#DCE6F5',
  texto: '#0A1F44',
  textoSuave: '#56688A',
  primaria: '#1D6FE8',
  primariaEscura: '#1857B8',
  textoNaPrimaria: '#FFFFFF',
  azulClaro: '#BBDDFA',
  destaque: '#FFB84D',
  textoNoDestaque: '#3A2500',
  sucesso: '#0B7A45',
  sucessoFundo: '#E4F5EC',
  alerta: '#B45309',
  alertaFundo: '#FFF3E0',
  erro: '#C93030',
  erroFundo: '#FDECEC',
  overlay: 'rgba(10,31,68,0.55)',
  branco: '#FFFFFF',
};

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const raio = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

/** Escala tipográfica (fonte do sistema: SF Pro no iOS, Roboto no Android). */
export const tipo: Record<
  'display' | 'titulo' | 'subtitulo' | 'corpo' | 'corpoForte' | 'legenda' | 'rotulo' | 'preco' | 'botao',
  TextStyle
> = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4, color: cores.texto },
  titulo: { fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.3, color: cores.texto },
  subtitulo: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: cores.texto },
  corpo: { fontSize: 15, lineHeight: 22, color: cores.texto },
  corpoForte: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: cores.texto },
  legenda: { fontSize: 13, lineHeight: 18, color: cores.textoSuave },
  rotulo: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: cores.textoSuave,
  },
  preco: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: cores.primaria },
  botao: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
};

/** Atalhos mantidos para as telas simples (login e cadastro). */
export const fonte = {
  titulo: tipo.titulo,
  subtitulo: tipo.subtitulo,
  corpo: tipo.corpo,
  suave: tipo.legenda,
};

const sombraBase = (opacidade: number, raioSombra: number, y: number, elevacao: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0A1F44',
      shadowOpacity: opacidade,
      shadowRadius: raioSombra,
      shadowOffset: { width: 0, height: y },
    },
    default: { elevation: elevacao, shadowColor: '#0A1F44' },
  }) as ViewStyle;

export const sombra = sombraBase(0.07, 12, 4, 2);
export const sombraMedia = sombraBase(0.12, 18, 8, 5);

/** Durações das animações (ms): discretas e rápidas. */
export const duracao = { rapida: 140, normal: 240, lenta: 420 };

// Área mínima de toque recomendada pelas diretrizes de acessibilidade (44 pt).
export const ALVO_MINIMO = 44;
