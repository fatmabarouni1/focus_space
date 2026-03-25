const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

export type GoalRecord = {
  _id: string;
  title: string;
  description?: string;
  target: number;
  current?: number;
  unit: string;
  deadline?: string | null;
  created_at?: string;
};

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function fetchGoals(token: string): Promise<GoalRecord[]> {
  const response = await fetch(buildApiUrl("/api/goals"), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load goals.");
  }

  const data = await response.json();
  return data.goals ?? [];
}

export async function createGoal(
  token: string,
  payload: {
    title: string;
    description?: string;
    target: number;
    unit: string;
    deadline?: string;
  }
): Promise<GoalRecord> {
  const response = await fetch(buildApiUrl("/api/goals"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create goal.");
  }

  const data = await response.json();
  return data.goal;
}

export async function updateGoal(
  token: string,
  goalId: string,
  payload: {
    title?: string;
    description?: string;
    target?: number;
    current?: number;
    unit?: string;
    deadline?: string | null;
  }
): Promise<GoalRecord> {
  const response = await fetch(buildApiUrl(`/api/goals/${goalId}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to update goal.");
  }

  const data = await response.json();
  return data.goal;
}

export async function deleteGoal(token: string, goalId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/goals/${goalId}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete goal.");
  }
}
