export function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function safeCallbackUrl(value: unknown, fallback = "/invite") {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function callbackPathFromAuthCookie(
  value: unknown,
  fallback = "/invite",
) {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  try {
    const parsed = new URL(decoded, "http://auth.local");
    return safeCallbackUrl(
      `${parsed.pathname}${parsed.search}${parsed.hash}`,
      fallback,
    );
  } catch {
    return fallback;
  }
}

export function inviteCodeFromCallbackUrl(value: unknown) {
  const callbackUrl = safeCallbackUrl(value, "");
  if (!callbackUrl) {
    return null;
  }

  const parsed = new URL(callbackUrl, "http://invite.local");
  if (parsed.pathname !== "/invite") {
    return null;
  }

  return parsed.searchParams.get("code");
}
