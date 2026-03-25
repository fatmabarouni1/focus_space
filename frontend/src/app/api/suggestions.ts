const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

export type Suggestion = {
  _id?: string;
  title: string;
  description?: string;
  level?: string;
  source?: "manual" | "ai";
  moduleId?: string | null;
  createdAt?: string;
};

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function fetchSuggestions(
  token: string,
  moduleId?: string
): Promise<Suggestion[]> {
  const params = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : "";
  const response = await fetch(buildApiUrl(`/api/suggestions${params}`), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load suggestions.");
  }

  const data = await response.json();
  return data.suggestions ?? [];
}

export async function createSuggestion(
  token: string,
  payload: Suggestion
): Promise<Suggestion> {
  const response = await fetch(buildApiUrl("/api/suggestions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create suggestion.");
  }

  const data = await response.json();
  return data.suggestion;
}

export async function deleteSuggestion(
  token: string,
  suggestionId: string
): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/suggestions/${suggestionId}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete suggestion.");
  }
}
