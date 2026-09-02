/**
 * Superfície pública da camada HTTP. A UI importa daqui — nunca chumba URL
 * nem shape de payload. Cresce conforme as telas do trilho B chegam (B2+).
 */
export * as authApi from './auth';
export * as contextsApi from './contexts';
export { bindAuthToken, ApiError, http, unwrapData } from './http';
export { API_BASE_URL } from './config';
