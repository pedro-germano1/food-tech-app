import { ImageSourcePropType } from 'react-native';

/**
 * Imagens dos produtos que acompanham o app.
 * O Metro exige caminhos estáticos em require(), por isso o mapa é escrito à mão.
 * Para usar fotografias próprias, basta substituir os arquivos em assets/produtos
 * mantendo os nomes (ou apontar `imagemUrl` na API real).
 */
const IMAGENS: Record<string, ImageSourcePropType> = {
  classico: require('../../assets/produtos/classico.png'),
  cheddar: require('../../assets/produtos/cheddar.png'),
  duplo: require('../../assets/produtos/duplo.png'),
  frango: require('../../assets/produtos/frango.png'),
  veggie: require('../../assets/produtos/veggie.png'),
  batata: require('../../assets/produtos/batata.png'),
  rings: require('../../assets/produtos/rings.png'),
  refri: require('../../assets/produtos/refri.png'),
  suco: require('../../assets/produtos/suco.png'),
  shake: require('../../assets/produtos/shake.png'),
  brownie: require('../../assets/produtos/brownie.png'),
  combo1: require('../../assets/produtos/combo1.png'),
  combo2: require('../../assets/produtos/combo2.png'),
};

const PADRAO: ImageSourcePropType = IMAGENS.classico;

export function fonteImagem(item: { imagem?: string; imagemUrl?: string }): ImageSourcePropType {
  if (item.imagemUrl) return { uri: item.imagemUrl };
  if (item.imagem && IMAGENS[item.imagem]) return IMAGENS[item.imagem];
  return PADRAO;
}
