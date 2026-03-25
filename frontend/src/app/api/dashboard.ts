const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

export type DashboardPayload = {
  targets: {
    dailySessionsTarget: number;
    weeklySessionsTarget: number;
    dailyFocusMinutesTarget: number;
  };
  stats: {
    sessionsToday: number;
    focusMinutesToday: number;
    sessionsThisWeek: number;
  };
  streaks: {
    streakCount: number;
    freezeTokens: number;
    warningActive: boolean;
    streakStatus: "ok" | "warning" | "frozen" | "lost";
  };
  progress: {
    dailySessionsProgress: number;
    weeklySessionsProgress: number;
    dailyFocusProgress: number;
  };
  timeZone: string;
};

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
});

export async function fetchDashboard(token: string): Promise<DashboardPayload> {
  const response = await fetch(buildApiUrl("/api/dashboard"), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load dashboard.");
  }

  return response.json();
}

export async function updateDashboardTargets(
  token: string,
  payload: Partial<DashboardPayload["targets"]>
): Promise<DashboardPayload["targets"]> {
  const response = await fetch(buildApiUrl("/api/dashboard/targets"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to update targets.");
  }

  const data = await response.json();
  return data.targets;
}

export async function useFreezeToken(token: string): Promise<DashboardPayload["streaks"]> {
  const response = await fetch(buildApiUrl("/api/dashboard/streaks/freeze"), {
    method: "POST",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to use freeze token.");
  }

  const data = await response.json();
  return data.streaks;
}
