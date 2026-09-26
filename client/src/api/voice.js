import { apiClient } from './client.js';

/**
 * Parse a spoken/typed command into a suggested operation (never writes).
 * @param {{ text: string, language: 'en-IN'|'hi-IN'|'gu-IN', contextType?: 'RECEIPT'|'DELIVERY'|'INTERNAL' }} body
 */
export const parseVoiceCommandApi = (body) => apiClient.post('/voice/parse', body);
