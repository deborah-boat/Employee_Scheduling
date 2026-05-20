export function readStoredAuth(rawValue) {
  try {
    if (!rawValue) {
      return { role: null, user: null };
    }

    const parsed = JSON.parse(rawValue);
    if (!parsed?.role || !parsed?.user) {
      return { role: null, user: null };
    }

    return {
      role: parsed.role,
      user: parsed.user
    };
  } catch {
    return { role: null, user: null };
  }
}