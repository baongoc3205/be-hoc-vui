import { ApiClient } from './types';
import { mockApiClient } from './mockApiClient';

export * from './types';
export * from './mockApiClient';

// Current default API client is the mock implementation
export const api: ApiClient = mockApiClient;
