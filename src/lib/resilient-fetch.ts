/**
 * Resilient fetch helper que utiliza { keepalive: true } e credentials: 'include'.
 * Garante que a requisição de salvamento de estado não seja cancelada caso o usuário
 * navegue para outra tela, recarregue a página (F5) ou feche a aba.
 */
export async function resilientFetch<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    credentials: 'include',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.detail || 'Falha na requisição');
    error.response = { status: response.status, data: errorData };
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json().catch(() => ({} as T));
}
