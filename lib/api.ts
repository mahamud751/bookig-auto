const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export type AuthResponse = {
  accessToken: string;
  user: { id: string; phone: string; businessId: string; name: string };
};

function parseApiError(errorText: string, fallback: string) {
  try {
    const parsed = JSON.parse(errorText) as { message?: string | string[] };
    const msg = parsed.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string" && msg.trim()) return msg;
  } catch {
    // not JSON
  }
  return errorText.trim() || fallback;
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(parseApiError(errorText, "Request failed"));
  }
  return res.json() as Promise<T>;
}

export function normalizePhoneInput(input: string) {
  let phone = input.trim().replace(/[\s-]/g, "");
  if (phone.startsWith("+880")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("880") && phone.length >= 12) phone = `0${phone.slice(3)}`;
  else if (/^1\d{9}$/.test(phone)) phone = `0${phone}`;
  return phone;
}

export async function login(phone: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone: normalizePhoneInput(phone), password }),
  });
}

export async function register(payload: {
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  password: string;
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...payload, phone: normalizePhoneInput(payload.phone) }),
  });
}

export async function uploadProductImages(token: string, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  const res = await fetch(`${API_BASE}/products/upload-multiple`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(parseApiError(errorText, "Upload failed"));
  }
  return res.json() as Promise<{ images: string[]; imageUrl: string | null }>;
}

export async function fetchMyBusiness(token: string) {
  return apiRequest<{ id: string; slug: string; name: string; ownerName: string; phone: string }>(
    "/businesses/me",
    { token },
  );
}
