export interface Administrator {
  id: number;
  name: string;
  email: string;
}

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  external_reference: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  name: string;
  email: string;
  phone: string;
  external_reference: string;
  notes: string;
}

export interface LedgerEntry {
  id: number;
  type: "earning" | "expense";
  amount_minor: number;
  occurred_on: string;
  description: string;
  created_at: string;
}

export interface LedgerReport {
  client: Client;
  summary: {
    earnings_minor: number;
    expenses_minor: number;
    balance_minor: number;
  };
  entries: LedgerEntry[];
}

export interface LedgerEntryInput {
  client_id: number;
  type: "earning" | "expense";
  amount: string;
  occurred_on: string;
  description: string;
}

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
let csrfToken: string | null = null;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      "The PHP API is unavailable. Start the backend service and try again.",
      0,
      "api_unavailable",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ErrorPayload;

    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("ledger:unauthenticated"));
    }

    throw new ApiError(
      payload.error?.message ?? "The request could not be completed.",
      response.status,
      payload.error?.code ?? "request_failed",
      payload.error?.fields,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  const response = await request<{ data: { token: string } }>("/auth/csrf");
  csrfToken = response.data.token;
  return csrfToken;
}

async function mutate<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "X-CSRF-Token": await getCsrfToken() },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

export const api = {
  async me(): Promise<Administrator> {
    return (await request<{ data: Administrator }>("/auth/me")).data;
  },
  async login(email: string, password: string): Promise<Administrator> {
    const administrator = (await mutate<{ data: Administrator }>("/auth/login", { email, password })).data;
    csrfToken = null;
    return administrator;
  },
  async logout(): Promise<void> {
    await mutate<void>("/auth/logout");
    csrfToken = null;
  },
  async clients(query = ""): Promise<Client[]> {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    const suffix = params.size ? `?${params.toString()}` : "";
    return (await request<{ data: Client[] }>(`/clients${suffix}`)).data;
  },
  async createClient(input: ClientInput): Promise<number> {
    return (await mutate<{ data: { id: number } }>("/clients", input)).data.id;
  },
  async removeClient(clientId: number): Promise<void> {
    await mutate<void>("/clients/remove", { client_id: clientId });
  },
  async ledger(clientId: number, from = "", to = ""): Promise<LedgerReport> {
    const params = new URLSearchParams({ client_id: String(clientId) });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return (await request<{ data: LedgerReport }>(`/ledger?${params.toString()}`)).data;
  },
  async createLedgerEntry(input: LedgerEntryInput): Promise<number> {
    return (await mutate<{ data: { id: number } }>("/ledger", input)).data.id;
  },
  async removeLedgerEntry(entryId: number, clientId: number): Promise<void> {
    await mutate<void>("/ledger/remove", { entry_id: entryId, client_id: clientId });
  },
};