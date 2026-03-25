const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

export type CourseSuggestion = {
  _id?: string;
  title: string;
  description?: string;
  level?: string;
  createdAt?: string;
};

// Example: fetch all course suggestions.
export async function fetchCourseSuggestions(): Promise<CourseSuggestion[]> {
  const response = await fetch(buildApiUrl("/api/coursesuggestions"));
  if (!response.ok) {
    throw new Error("Failed to load course suggestions.");
  }
  return response.json();
}

// Example: create a new course suggestion.
export async function createCourseSuggestion(
  payload: CourseSuggestion
): Promise<CourseSuggestion> {
  const response = await fetch(buildApiUrl("/api/coursesuggestions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create course suggestion.");
  }

  return response.json();
}
