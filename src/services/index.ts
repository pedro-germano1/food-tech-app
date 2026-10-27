import { config } from '../config';
import { apiHttp } from './apiHttp';
import { apiMock } from './apiMock';
import { Api } from './tipos';

/** Instância única usada por todo o app. Troque em src/config.ts (USAR_MOCK). */
export const api: Api = config.USAR_MOCK ? apiMock : apiHttp;

export { ApiError, ehErroDeRede, mensagemDeErro } from './erros';
