const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export type RoomStatus = "focus" | "break" | "idle";

export interface RoomHost {
  id: string;
  name: string;
}

export interface RoomListItem {
  _id: string;
  title: string;
  status: RoomStatus;
  participantsCount: number;
  host: RoomHost | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  status: RoomStatus;
  joinedAt: string;
}

export async function fetchRooms(token: string) {
  const response = await fetch(buildApiUrl("/api/rooms"), {
    headers: {
      ...getAuthHeaders(token),
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to load rooms.");
  }

  const data = await response.json();
  return data.rooms as RoomListItem[];
}

export async function fetchRoom(token: string, roomId: string) {
  const response = await fetch(buildApiUrl(`/api/rooms/${roomId}`), {
    headers: {
      ...getAuthHeaders(token),
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to load room.");
  }

  return response.json() as Promise<{ room: RoomListItem; participants: RoomParticipant[] }>;
}

export async function createRoom(token: string, title: string) {
  const response = await fetch(buildApiUrl("/api/rooms"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create room.");
  }

  return response.json() as Promise<{ room: RoomListItem }>;
}

export async function joinRoom(token: string, roomId: string) {
  const response = await fetch(buildApiUrl(`/api/rooms/${roomId}/join`), {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to join room.");
  }

  return response.json();
}

export async function leaveRoom(token: string, roomId: string) {
  const response = await fetch(buildApiUrl(`/api/rooms/${roomId}/leave`), {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to leave room.");
  }

  return response.json();
}
