const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

export type RevisionModule = {
  _id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type ModuleDocument = {
  _id: string;
  originalName: string;
  filename: string;
  url: string;
  mime_type: string;
  size: number;
  uploadedAt?: string;
  original_name?: string;
  created_at?: string;
};

export type ModuleNote = {
  _id: string;
  content: string;
  updated_at?: string;
};

export type ModuleLink = {
  _id: string;
  title: string;
  url: string;
  created_at?: string;
};

export type ResourceRecommendation = {
  title: string;
  type: "video" | "course" | "article" | "documentation";
  platform: string;
  url: string;
  whyThisHelps: string;
  difficulty: "beginner" | "intermediate" | "advanced";
};

export type StudyCoachSummary = {
  title?: string;
  summary: string;
  keyConcepts?: string[];
  mainIdeas?: string[];
  importantDefinitions?: { term: string; definition: string }[];
  keyTakeaways?: string[];
  keyPoints: string[];
  glossary: { term: string; definition: string }[];
};

export type StudyCoachQuiz = {
  questions: {
    type: "mcq" | "short";
    question: string;
    choices?: string[];
    answerIndex?: number;
    answer?: string;
    explanation?: string;
  }[];
};

export type StudyCoachResources = {
  recommendedResources: ResourceRecommendation[];
};

export type StudyCoachResponse<T> = {
  cached: boolean;
  output: T;
  createdAt?: string;
  meta?: {
    notesIncluded: boolean;
    pdfTextIncluded: boolean;
    extractedChars: number;
    pdfExtractionWarning?: boolean;
  };
};

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const parseJsonSafe = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

export async function fetchModules(token: string): Promise<RevisionModule[]> {
  const response = await fetch(buildApiUrl("/api/revision/modules"), {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to load modules.");
  }
  const data = await response.json();
  return data.modules ?? [];
}

export async function createModule(
  token: string,
  payload: { title: string; description?: string }
): Promise<RevisionModule> {
  const response = await fetch(buildApiUrl("/api/revision/modules"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create module.");
  }
  const data = await response.json();
  return data.module;
}

export async function fetchModule(
  token: string,
  moduleId: string
): Promise<RevisionModule> {
  const response = await fetch(buildApiUrl(`/api/revision/modules/${moduleId}`), {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to load module.");
  }
  const data = await response.json();
  return data.module;
}

export async function deleteModule(token: string, moduleId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/revision/modules/${moduleId}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete module.");
  }
}

export async function fetchDocuments(
  token: string,
  moduleId: string
): Promise<ModuleDocument[]> {
  const response = await fetch(buildApiUrl(`/api/revision/modules/${moduleId}/documents`), {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to load documents.");
  }
  const data = await response.json();
  return data.documents ?? [];
}

export async function uploadDocument(
  token: string,
  moduleId: string,
  file: File
): Promise<ModuleDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildApiUrl(`/api/revision/modules/${moduleId}/documents`), {
    method: "POST",
    headers: getAuthHeaders(token),
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to upload document.");
  }
  const data = await response.json();
  return data.document;
}

export async function deleteDocument(token: string, documentId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/revision/documents/${documentId}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete document.");
  }
}

export async function fetchNote(
  token: string,
  moduleId: string
): Promise<ModuleNote | null> {
  const response = await fetch(buildApiUrl(`/api/revision/modules/${moduleId}/notes`), {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to load note.");
  }
  const data = await response.json();
  return data.note ?? null;
}

export async function saveNote(
  token: string,
  moduleId: string,
  content: string
): Promise<ModuleNote> {
  const response = await fetch(buildApiUrl(`/api/revision/modules/${moduleId}/notes`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to save note.");
  }
  const data = await response.json();
  return data.note;
}

export async function fetchLinks(
  token: string,
  moduleId: string
): Promise<ModuleLink[]> {
  const response = await fetch(buildApiUrl(`/api/revision/modules/${moduleId}/links`), {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to load links.");
  }
  const data = await response.json();
  return data.links ?? [];
}

export async function createLink(
  token: string,
  moduleId: string,
  payload: { title: string; url: string }
): Promise<ModuleLink> {
  const response = await fetch(buildApiUrl(`/api/revision/modules/${moduleId}/links`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to create link.");
  }
  const data = await response.json();
  return data.link;
}

export async function deleteLink(token: string, linkId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/revision/links/${linkId}`), {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete link.");
  }
}

export async function generateModuleSummary(
  token: string,
  moduleId: string
): Promise<StudyCoachResponse<StudyCoachSummary>> {
  const response = await fetch(buildApiUrl(`/api/modules/${moduleId}/ai/summary`), {
    method: "POST",
    headers: getAuthHeaders(token),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || "Failed to generate summary.");
  }
  return data;
}

export async function generateModuleQuiz(
  token: string,
  moduleId: string
): Promise<StudyCoachResponse<StudyCoachQuiz>> {
  const response = await fetch(buildApiUrl(`/api/modules/${moduleId}/ai/quiz`), {
    method: "POST",
    headers: getAuthHeaders(token),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || "Failed to generate quiz.");
  }
  return data;
}

export async function generateModuleResources(
  token: string,
  moduleId: string
): Promise<StudyCoachResponse<StudyCoachResources>> {
  const response = await fetch(buildApiUrl(`/api/modules/${moduleId}/ai/resources`), {
    method: "POST",
    headers: getAuthHeaders(token),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(
      data?.error?.message || data?.message || "Failed to generate resources."
    );
  }
  return data;
}
