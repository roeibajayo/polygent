export interface Options {
  ignoreErrors?: boolean;
  sessionCache?: boolean;
  querystring?: Record<string, any>;
}

export async function fetchGet<T>(url: string, options?: Options): Promise<T> {
  return fetchJson('GET', url, undefined, options);
}

export async function fetchPost<T>(
  url: string,
  body?: any,
  options?: Options
): Promise<T> {
  return fetchJson('POST', url, body, options);
}

export async function fetchPut<T>(
  url: string,
  body: any,
  options?: Options
): Promise<T> {
  return fetchJson('PUT', url, body, options);
}

export async function fetchDelete<T>(
  url: string,
  options?: Options
): Promise<T> {
  return fetchJson('DELETE', url, undefined, options);
}

async function fetchJson<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: any,
  options?: Options
): Promise<T> {
  if (options?.sessionCache) {
    const cached = sessionStorage.getItem(url);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  }

  if (options?.querystring) {
    const keys = Object.keys(options.querystring).filter(
      (x) => options.querystring![x] != null
    );
    if (keys.length > 0) {
      const queryString = keys
        .map((key) => {
          const value = options.querystring?.[key];
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join('&');
      url += `?${queryString}`;
    }
  }

  try {
    const response = await fetch(url, {
      method,
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw response;
    }

    if (response.status === 204) {
      return null as T;
    }

    const result = response.headers
      .get('Content-Type')
      ?.includes('application/json')
      ? ((await response.json()) as T)
      : ((await response.text()) as T);

    if (options?.sessionCache) {
      sessionStorage.setItem(url, JSON.stringify(result));
    }

    return result;
  } catch (error) {
    if (options?.ignoreErrors) {
      return null as T;
    }
    throw error;
  }
}

// API exports
export { default as workspacesApi } from './workspaces';
export { default as sessionsApi } from './sessions';
export { default as messagesApi } from './messages';
export { default as agentsApi } from './agents';
export { default as environmentsApi } from './environments';
export { default as environmentVariablesApi } from './environmentVariables';
export { default as workspaceEnvironmentVariablesApi } from './workspaceEnvironmentVariables';
export { default as tasksApi } from './tasks';
export { default as backlogsApi } from './backlogs';
export { default as mcpsApi } from './mcps';
export { default as startupApi } from './startup';
