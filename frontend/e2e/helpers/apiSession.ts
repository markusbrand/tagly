import type { Page } from '@playwright/test';

async function csrf(page: Page): Promise<string> {
  const res = await page.request.get('/api/v1/users/csrf/');
  if (!res.ok()) {
    throw new Error(`GET csrf -> ${res.status()} ${await res.text()}`);
  }
  const j = (await res.json()) as { csrfToken: string };
  return j.csrfToken;
}

export async function apiGetJson<T>(page: Page, path: string, params?: Record<string, string>): Promise<T> {
  const p = path.startsWith('/') ? path : `/${path}`;
  const res = await page.request.get(`/api/v1${p}`, { params });
  if (!res.ok()) {
    throw new Error(`GET ${p} -> ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPostJson<T>(page: Page, path: string, data: object): Promise<T> {
  const p = path.startsWith('/') ? path : `/${path}`;
  const token = await csrf(page);
  const res = await page.request.post(`/api/v1${p}`, {
    data,
    headers: { 'X-CSRFToken': token },
  });
  if (!res.ok()) {
    throw new Error(`POST ${p} -> ${res.status()} ${await res.text()}`);
  }
  if (res.status() === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function apiPatchJson<T>(page: Page, path: string, data: object): Promise<T> {
  const p = path.startsWith('/') ? path : `/${path}`;
  const token = await csrf(page);
  const res = await page.request.patch(`/api/v1${p}`, {
    data,
    headers: { 'X-CSRFToken': token },
  });
  if (!res.ok()) {
    throw new Error(`PATCH ${p} -> ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPutJson<T>(page: Page, path: string, data: object): Promise<T> {
  const p = path.startsWith('/') ? path : `/${path}`;
  const token = await csrf(page);
  const res = await page.request.put(`/api/v1${p}`, {
    data,
    headers: { 'X-CSRFToken': token },
  });
  if (!res.ok()) {
    throw new Error(`PUT ${p} -> ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function apiDelete(page: Page, path: string): Promise<void> {
  const p = path.startsWith('/') ? path : `/${path}`;
  const token = await csrf(page);
  const res = await page.request.delete(`/api/v1${p}`, {
    headers: { 'X-CSRFToken': token },
  });
  if (!res.ok()) {
    throw new Error(`DELETE ${p} -> ${res.status()} ${await res.text()}`);
  }
}
