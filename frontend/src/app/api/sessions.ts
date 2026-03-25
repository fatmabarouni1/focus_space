const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
});

export async function completeSession(
  token: string,
  payload: { title?: string; durationMinutes: number }
) {
  const response = await fetch(buildApiUrl("/api/sessions/complete"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({
      title: payload.title,
      duration_minutes: payload.durationMinutes,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to record session.");
  }

  return response.json();
}
