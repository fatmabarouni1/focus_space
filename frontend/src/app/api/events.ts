const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

export type EventRecord = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: "session" | "deadline" | "task";
  duration?: number | null;
  completed?: boolean;
};

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function fetchEvents(token: string): Promise<EventRecord[]> {
  const response = await fetch(buildApiUrl("/api/events"), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load events.");
  }

  const data = await response.json();
  return data.events ?? [];
}

export async function createEvent(
  token: string,
  payload: {
    title: string;
    description?: string;
    date: string;
    time?: string;
    type: "session" | "deadline" | "task";
    duration?: number | null;
  }
): Promise<EventRecord> {
  const response = await fetch(buildApiUrl("/api/events"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create event.");
  }

  const data = await response.json();
  return data.event;
}

export async function updateEvent(
  token: string,
  eventId: string,
  payload: {
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    type?: "session" | "deadline" | "task";
    duration?: number | null;
    completed?: boolean;
  }
): Promise<EventRecord> {
  const response = await fetch(buildApiUrl(`/api/events/${eventId}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to update event.");
  }

  const data = await response.json();
  return data.event;
}

export async function deleteEvent(token: string, eventId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/events/${eventId}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete event.");
  }
}
