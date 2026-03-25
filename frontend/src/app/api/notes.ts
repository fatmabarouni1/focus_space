const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

export type NoteRecord = {
  _id: string;
  title: string;
  content: string;
  created_at?: string;
};

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export async function fetchNotes(token: string): Promise<NoteRecord[]> {
  const response = await fetch(buildApiUrl("/api/notes"), {
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to load notes.");
  }

  const data = await response.json();
  return data.notes ?? [];
}

export async function createNote(
  token: string,
  payload: { title: string; content: string }
): Promise<NoteRecord> {
  const response = await fetch(buildApiUrl("/api/notes"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create note.");
  }

  const data = await response.json();
  return data.note;
}

export async function updateNote(
  token: string,
  noteId: string,
  payload: { title: string; content: string }
): Promise<NoteRecord> {
  const response = await fetch(buildApiUrl(`/api/notes/${noteId}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to update note.");
  }

  const data = await response.json();
  return data.note;
}

export async function deleteNote(token: string, noteId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/notes/${noteId}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete note.");
  }
}
