const API_ORIGIN =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");

export function assetUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function siteBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function siteUrl(path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteBaseUrl().replace(/\/$/, "")}${normalized}`;
}
