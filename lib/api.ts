// lib/api.ts
import { fetchWithErrorHandling, fetchWithToastOnly, showErrorToast } from "./error-handler"

// Use environment variable for API base URL to call backend directly
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export type BuildResponse = {
  job_id: string;
  status: string;
  collection_id?: string;
  docs?: number;
  chunks?: number;
  duration_sec?: number;
  saved_files?: string[];
  message?: string;
};

export type QueryHit = {
  rank: number;
  doc_id: string;
  file_name: string;
  page: number;
  heading: string;
  snippet: string;
  score: number;
  collection_id?: string; // Add collection_id to individual hits
  bbox?: number[];
  page_height_pt?: number;
  bbox_origin?: string; // 'BL'
  /** section rectangles (BL origin) for this page */
  areas?: number[][];
  /** section quads (BL origin) for this page; each = 8 numbers */
  quads?: number[][];
};

export type QueryMode = "legacy" | "context";

export type QueryResponse = {
  collection_id: string;
  persona: string;
  job: string;
  mode?: QueryMode;
  k?: number; // server echoes 10
  query_text?: string;
  results: QueryHit[];
  latency_ms: number;
};

/** Viewer selection payload (FE only) */
export type ViewerSelection = {
  text: string;
  page: number;
  bbox?: number[];
  quads?: number[][];
  fileName: string;
};

// Chat Service Types
export type ChatSession = {
  session_id: string;
  collection_id?: string;
  created_at: string;
  message_count: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  context_sections?: any[];
};

export type ChatResponse = {
  session_id: string;
  message: ChatMessage;
  context_used: any[];
};

// Insights Service Types
export type InsightType =
  | "key_findings"
  | "related_concepts"
  | "action_items"
  | "trends"
  | "gaps";

export type Insight = {
  id: string;
  type: InsightType;
  title: string;
  content: string;
  confidence: number;
  sources: Array<{
    file_name: string;
    page: number;
    snippet: string;
  }>;
};

export type InsightsResponse = {
  insights: Insight[];
  processing_time_ms: number;
  selected_text: string;
};

// Podcast Service Types
export type PodcastRequest = {
  content_type: "snippets" | "text";
  content: any; // snippets array or text string
  voice_style?: string;
  duration_preference?: string;
};

export type PodcastResponse = {
  audio_url: string;
  transcript: string;
  duration_seconds: number;
  processing_time_ms: number;
  generated_script?: string;
};

// Relevance Service Types
export type RelevanceAnalysis = {
  relevance_score: number;
  confidence_level: "high" | "medium" | "low";
  explanation: string;
  key_connections: string[];
  supporting_evidence: string[];
  // optional fields (shown in UI when present)
  relevance_type?: string;
  shared_concepts?: string[];
  relationship_strength?: string;
  additional_insights?: string;
  potential_follow_up?: string;
};

export type RelevanceResponse = {
  analysis: RelevanceAnalysis;
  processing_time_ms: number;
};

// Collection Summary Types
export type SummaryType = "comprehensive" | "executive" | "thematic";

export type CollectionSummary = {
  summary_id: string;
  collection_id: string;
  summary_type: SummaryType;
  content: string;
  generated_at: string;
  processing_time_ms: number;
};

/* ------------------------- normalization helpers -------------------------- */
function toNumber4(a: unknown): number[] | undefined {
  if (!Array.isArray(a) || a.length !== 4) return undefined;
  const nums = a.map((v) => (typeof v === "string" ? Number(v) : v)) as number[];
  return nums.every((n) => Number.isFinite(n)) ? nums : undefined;
}
function toNumber8(a: unknown): number[] | undefined {
  if (!Array.isArray(a) || a.length !== 8) return undefined;
  const nums = a.map((v) => (typeof v === "string" ? Number(v) : v)) as number[];
  return nums.every((n) => Number.isFinite(n)) ? nums : undefined;
}

function pickBBox(raw: any): number[] | undefined {
  return (
    toNumber4(raw?.bbox) ??
    toNumber4(raw?.rect) ??
    toNumber4(raw?.box) ??
    toNumber4(raw?.region)
  );
}

function pickAreas(raw: any): number[][] | undefined {
  if (!raw || !raw.areas) return undefined;
  if (!Array.isArray(raw.areas)) return undefined;
  const out: number[][] = [];
  for (const r of raw.areas) {
    const rect = toNumber4(r);
    if (rect) out.push(rect);
  }
  return out.length ? out : undefined;
}

function pickQuads(raw: any): number[][] | undefined {
  if (!raw || !raw.quads) return undefined;
  if (!Array.isArray(raw.quads)) return undefined;
  const out: number[][] = [];
  for (const q of raw.quads) {
    const quad = toNumber8(q);
    if (quad) out.push(quad);
  }
  return out.length ? out : undefined;
}

function normalizeHit(raw: any): QueryHit {
  const hit: QueryHit = {
    rank: Number(raw?.rank ?? 0),
    doc_id: String(raw?.doc_id ?? ""),
    file_name: String(raw?.file_name ?? ""),
    page: Number(raw?.page ?? 1),
    heading: String(raw?.heading ?? ""),
    snippet: String(raw?.snippet ?? ""),
    score: Number(raw?.score ?? 0),
    bbox: pickBBox(raw),
    page_height_pt:
      typeof raw?.page_height_pt === "number" ? raw.page_height_pt : undefined,
    bbox_origin: typeof raw?.bbox_origin === "string" ? raw.bbox_origin : undefined,
  };

  const areas = pickAreas(raw);
  if (areas) hit.areas = areas;
  const quads = pickQuads(raw);
  if (quads) hit.quads = quads;

  return hit;
}
/* ------------------------------------------------------------------------- */

export async function buildCollection(files: File[]): Promise<BuildResponse | null> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const result = await fetchWithToastOnly(`${API_BASE}/collections/build`, {
    method: "POST",
    body: fd,
  }, "buildCollection");
  
  if (!result.success || !result.response) {
    return null;
  }
  
  return result.response.json();
}

/**
 * Unified query supporting both modes.
 * NOTE: The backend ALWAYS returns up to Top-10.
 * We still send k=10 explicitly from the client.
 */
export async function queryTopK(args: {
  mode: QueryMode;
  persona?: string;
  job?: string;
  queryText?: string;
  collectionId?: string; // Add collection_id parameter
  k?: number; // ignored; server returns 10
}): Promise<QueryResponse | null> {
  const { mode, persona = "", job = "", queryText = "", collectionId } = args;

  const fd = new FormData();
  fd.append("mode", mode);
  fd.append("k", "10"); // always ask for 10; server enforces 10 anyway
  
  // Add collection_id if provided
  if (collectionId) {
    fd.append("collection_id", collectionId);
  }
  
  if (mode === "legacy") {
    fd.append("persona", persona);
    fd.append("job", job);
  } else {
    fd.append("query_text", queryText);
    // We do NOT pass persona/job here to avoid cross-mode interference
    if (persona) fd.append("persona", persona);
    if (job) fd.append("job", job);
  }

  const result = await fetchWithToastOnly(`${API_BASE}/query`, { 
    method: "POST", 
    body: fd 
  }, "queryTopK");
  
  if (!result.success || !result.response) {
    return null;
  }
  
  const json = await result.response.json();

  const results: QueryHit[] = Array.isArray(json?.results)
    ? json.results.map(normalizeHit)
    : [];

  const out: QueryResponse = {
    collection_id: String(json?.collection_id ?? ""),
    persona: String(json?.persona ?? ""),
    job: String(json?.job ?? ""),
    mode: json?.mode === "context" ? "context" : "legacy",
    k: 10,
    query_text: typeof json?.query_text === "string" ? json.query_text : undefined,
    results,
    latency_ms: Number(json?.latency_ms ?? 0),
  };

  if (results[0]) {
    // eslint-disable-next-line no-console
    console.log("[api.queryTopK] first normalized hit →", {
      file_name: results[0].file_name,
      page: results[0].page,
      bbox: results[0].bbox,
      areas: results[0].areas,
      quads: results[0].quads,
      page_height_pt: results[0].page_height_pt,
      bbox_origin: results[0].bbox_origin,
    });
  }

  return out;
}

/** Back-compat helper (still used elsewhere) */
export async function queryTop3(persona: string, job: string, collectionId?: string): Promise<QueryResponse> {
  return queryTopK({ mode: "legacy", persona, job, collectionId });
}

/** Build a PDF URL - now using relative path through Next.js proxy */
export function pdfUrl(fileName: string, collectionId?: string, page?: number) {
  let base = `${API_BASE}/docs/${encodeURIComponent(fileName)}`;
  
  // Add collection_id as query parameter if available
  if (collectionId) {
    base += `?collection_id=${encodeURIComponent(collectionId)}`;
  }
  
  return page ? `${base}#page=${page}` : base;
}

// Chat Service API Functions
export async function createChatSession(collectionId?: string): Promise<ChatSession | null> {
  const fd = new FormData();
  if (collectionId) fd.append("collection_id", collectionId);

  const result = await fetchWithToastOnly(`${API_BASE}/chat/sessions`, {
    method: "POST",
    body: fd,
  }, "createChatSession");
  
  if (!result.success || !result.response) {
    return null;
  }
  
  return result.response.json();
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
  contextSections?: any[]
): Promise<ChatResponse | null> {
  const fd = new FormData();
  fd.append("message", message);
  if (contextSections) {
    fd.append("context_sections", JSON.stringify(contextSections));
  }

  const result = await fetchWithToastOnly(`${API_BASE}/chat/sessions/${sessionId}/chat`, {
    method: "POST",
    body: fd,
  }, "sendChatMessage");

  if (!result.success || !result.response) {
    return null;
  }

  const data = await result.response.json();

  // Transform backend response to frontend expected format
  return {
    session_id: data.session_id,
    message: {
      id: Date.now().toString(), // Generate client-side ID
      role: "assistant",
      content: data.response,
      timestamp: data.timestamp,
      context_sections: contextSections,
    },
    context_used: contextSections || [],
  };
}

export async function getChatHistory(sessionId: string, limit?: number): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());

  const res = await fetchWithErrorHandling(`${API_BASE}/chat/sessions/${sessionId}/history?${params}`, {}, "getChatHistory");
  const data = await res.json();

  // Transform backend messages to frontend format
  const messages = data.messages || [];
  return messages.map((msg: any, index: number) => ({
    id: msg.id || `msg-${index}`,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    context_sections: msg.metadata?.context_sections,
  }));
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const res = await fetchWithErrorHandling(`${API_BASE}/chat/sessions`, {}, "listChatSessions");
  const data = await res.json();
  return data.sessions || [];
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const res = await fetchWithErrorHandling(`${API_BASE}/chat/sessions/${sessionId}`, {
    method: "DELETE",
  }, "deleteChatSession");
}

// Insights Service API Functions
export async function generateInsights(
  selectedText: string,
  relevantSections: any[],
  insightTypes?: InsightType[]
): Promise<InsightsResponse | null> {
  const fd = new FormData();
  fd.append("selected_text", selectedText);
  fd.append("relevant_sections", JSON.stringify(relevantSections));
  if (insightTypes) {
    fd.append("insight_types", JSON.stringify(insightTypes));
  }

  const result = await fetchWithToastOnly(`${API_BASE}/insights/generate`, {
    method: "POST",
    body: fd,
  }, "generateInsights");
  
  if (!result.success || !result.response) {
    return null;
  }
  
  return result.response.json();
}

export async function generateQuickInsights(
  selectedText: string,
  relevantSections: any[]
): Promise<InsightsResponse> {
  const fd = new FormData();
  fd.append("selected_text", selectedText);
  fd.append("relevant_sections", JSON.stringify(relevantSections));

  const res = await fetchWithErrorHandling(`${API_BASE}/insights/generate_quick`, {
    method: "POST",
    body: fd,
  }, "generateQuickInsights");
  return res.json();
}

// Podcast Service API Functions
export async function generatePodcastFromSnippets(
  snippets: any[],
  podcastType?: string,
  durationPreference?: string,
  language?: string,
  theme?: string,
  collectionId?: string
): Promise<PodcastResponse> {
  const fd = new FormData();
  fd.append("snippets", JSON.stringify(snippets));
  if (podcastType) fd.append("podcast_type", podcastType);
  if (durationPreference) fd.append("duration_preference", durationPreference);
  if (language) fd.append("language", language);
  if (theme) fd.append("theme", theme);
  if (collectionId) fd.append("collection_id", collectionId);

  const res = await fetchWithErrorHandling(`${API_BASE}/podcast/generate_from_snippets`, {
    method: "POST",
    body: fd,
  }, "generatePodcast");

  const data = await res.json();

  // Transform backend response to frontend expected format
  const audioUrl = data.collection_id 
    ? `${API_BASE}/podcast/audio/${data.filename}?collection_id=${data.collection_id}`
    : `${API_BASE}/podcast/audio/${data.filename}`;

  return {
    audio_url: audioUrl,
    transcript: data.content_summary || "",
    duration_seconds: 0, // Backend doesn't provide this yet
    processing_time_ms: data.processing_time_ms || 0,
    generated_script: data.generated_script || "",
  };
}

export async function generatePodcastFromText(
  text: string,
  podcastType?: string,
  durationPreference?: string,
  language?: string,
  theme?: string,
  collectionId?: string
): Promise<PodcastResponse> {
  const fd = new FormData();
  fd.append("text_input", text);
  if (podcastType) fd.append("podcast_type", podcastType);
  if (durationPreference) fd.append("duration_preference", durationPreference);
  if (language) fd.append("language", language);
  if (theme) fd.append("theme", theme);
  if (collectionId) fd.append("collection_id", collectionId);

  const res = await fetchWithErrorHandling(`${API_BASE}/podcast/generate_from_text`, {
    method: "POST",
    body: fd,
  }, "generatePodcast");

  const data = await res.json();

  // Transform backend response to frontend expected format
  const audioUrl = data.collection_id 
    ? `${API_BASE}/podcast/audio/${data.filename}?collection_id=${data.collection_id}`
    : `${API_BASE}/podcast/audio/${data.filename}`;

  return {
    audio_url: audioUrl,
    transcript: data.message || "",
    duration_seconds: 0, // Backend doesn't provide this yet
    processing_time_ms: data.processing_time_ms || 0,
    generated_script: data.generated_script || "",
  };
}

export async function generatePodcastFromCollection(
  collectionId: string,
  podcastType?: string,
  durationPreference?: string,
  language?: string,
  summaryType?: string,
  theme?: string
): Promise<PodcastResponse> {
  const fd = new FormData();
  fd.append("collection_id", collectionId);
  if (podcastType) fd.append("podcast_type", podcastType);
  if (durationPreference) fd.append("duration_preference", durationPreference);
  if (language) fd.append("language", language);
  if (summaryType) fd.append("summary_type", summaryType);
  if (theme) fd.append("theme", theme);

  const res = await fetchWithErrorHandling(`${API_BASE}/podcast/generate_from_collection`, {
    method: "POST",
    body: fd,
  }, "generatePodcast");

  const data = await res.json();

  // Transform backend response to frontend expected format
  return {
    audio_url: `${API_BASE}/podcast/audio/${data.filename}?collection_id=${collectionId}`,
    transcript: data.content_summary || "",
    duration_seconds: 0, // Backend doesn't provide this yet
    processing_time_ms: data.processing_time_ms || 0,
    generated_script: data.generated_script || "",
  };
}

/* --------------------- Relevance Service API Functions -------------------- */

function extractJsonFromString(s: string): any | null {
  try {
    if (!s) return null;
    let t = String(s).trim();

    // Strip code fences and "json" prefixes
    t = t.replace(/```json/gi, "```");
    t = t.replace(/```/g, "");
    t = t.replace(/^["']?json["']?\s*/i, "");

    // If extra text surrounds the JSON, slice from first "{" to last "}"
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      t = t.slice(start, end + 1);
    }
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function normalizeRelevancePayload(raw: any): any {
  if (!raw) return {};
  if (typeof raw === "string") {
    const parsed = extractJsonFromString(raw);
    if (parsed) return parsed;
    return {
      relevance_type: "analysis_error",
      explanation: raw,
      confidence: "low",
      parse_error: true,
    };
  }
  if (typeof raw === "object") return raw;
  return {};
}

export async function analyzeRelevance(
  selectedText: string,
  relevantSection: any,
  analysisDepth: "quick" | "standard" | "detailed" = "standard"
): Promise<RelevanceResponse> {
  const fd = new FormData();
  fd.append("selected_text", selectedText);
  fd.append("relevant_section", JSON.stringify(relevantSection));
  fd.append("analysis_depth", analysisDepth);

  const res = await fetchWithErrorHandling(`${API_BASE}/relevance/analyze_single`, {
    method: "POST",
    body: fd,
  }, "analyzeRelevance");

  const data = await res.json();
  console.log("Raw backend response:", data);

  const raw = data.relevance_analysis ?? data.analysis ?? {};
  const relevanceAnalysis = normalizeRelevancePayload(raw);

  console.log("Final relevance analysis:", relevanceAnalysis);

  const score =
    typeof relevantSection?.score === "number"
      ? relevantSection.score
      : Number(relevantSection?.score ?? 0.5);

  return {
    analysis: {
      relevance_score: Number.isFinite(score) ? score : 0.5,
      confidence_level:
        (relevanceAnalysis.confidence ||
          relevanceAnalysis.confidence_level ||
          "medium") as "high" | "medium" | "low",
      explanation: relevanceAnalysis.explanation || "No explanation available",
      key_connections: relevanceAnalysis.key_connections || [],
      supporting_evidence: relevanceAnalysis.supporting_evidence || [],
      relevance_type: relevanceAnalysis.relevance_type,
      shared_concepts: relevanceAnalysis.shared_concepts,
      relationship_strength: relevanceAnalysis.relationship_strength,
      additional_insights: relevanceAnalysis.additional_insights,
      potential_follow_up: relevanceAnalysis.potential_follow_up,
    },
    processing_time_ms: data.processing_time_ms || 0,
  };
}

export async function analyzeMultipleRelevance(
  selectedText: string,
  relevantSections: any[],
  analysisDepth: "quick" | "standard" | "detailed" = "standard"
): Promise<RelevanceResponse[]> {
  const fd = new FormData();
  fd.append("selected_text", selectedText);
  fd.append("relevant_sections", JSON.stringify(relevantSections));
  fd.append("analysis_depth", analysisDepth);

  const res = await fetchWithErrorHandling(`${API_BASE}/relevance/analyze_multiple`, {
    method: "POST",
    body: fd,
  }, "analyzeRelevance");

  const data = await res.json();

  const individualAnalyses = Array.isArray(data.individual_analyses)
    ? data.individual_analyses
    : [];

  return individualAnalyses.map((entry: any, idx: number) => {
    const section = relevantSections[idx] || {};
    const raw = entry.relevance_analysis ?? entry.analysis ?? {};
    const relevanceAnalysis = normalizeRelevancePayload(raw);

    const score =
      typeof section?.score === "number" ? section.score : Number(section?.score ?? 0.5);

    return {
      analysis: {
        relevance_score: Number.isFinite(score) ? score : 0.5,
        confidence_level:
          (relevanceAnalysis.confidence ||
            relevanceAnalysis.confidence_level ||
            "medium") as "high" | "medium" | "low",
        explanation: relevanceAnalysis.explanation || "No explanation available",
        key_connections: relevanceAnalysis.key_connections || [],
        supporting_evidence: relevanceAnalysis.supporting_evidence || [],
        relevance_type: relevanceAnalysis.relevance_type,
        shared_concepts: relevanceAnalysis.shared_concepts,
        relationship_strength: relevanceAnalysis.relationship_strength,
        additional_insights: relevanceAnalysis.additional_insights,
        potential_follow_up: relevanceAnalysis.potential_follow_up,
      },
      processing_time_ms: data.processing_time_ms || 0,
    };
  });
}

// Collection Summary Service API Functions
export async function generateCollectionSummary(
  collectionId: string,
  summaryType: SummaryType = "comprehensive"
): Promise<CollectionSummary> {
  const fd = new FormData();
  fd.append("collection_id", collectionId);
  fd.append("summary_type", summaryType);

  const res = await fetchWithErrorHandling(`${API_BASE}/collection_summary/generate`, {
    method: "POST",
    body: fd,
  }, "generateCollectionSummary");

  const data = await res.json();

  // Pass the entire backend response as JSON string for the component to parse
  const content = JSON.stringify(data);

  return {
    summary_id: `${collectionId}_${summaryType}`,
    collection_id: data.collection_id,
    summary_type: data.summary_type,
    content,
    generated_at: data.generated_at,
    processing_time_ms: data.processing_time_ms || 0,
  };
}

export async function getCollectionSummary(
  collectionId: string,
  summaryType: SummaryType = "comprehensive"
): Promise<CollectionSummary> {
  const res = await fetchWithErrorHandling(
    `${API_BASE}/collection_summary/get/${collectionId}?summary_type=${summaryType}`,
    {},
    "getCollectionSummary"
  );

  const data = await res.json();

  // Pass the entire backend response as JSON string for the component to parse
  const content = JSON.stringify(data);

  return {
    summary_id: `${collectionId}_${summaryType}`,
    collection_id: data.collection_id,
    summary_type: data.summary_type,
    content,
    generated_at: data.generated_at,
    processing_time_ms: data.processing_time_ms || 0,
  };
}

export async function listCollectionSummaries(
  collectionId?: string
): Promise<CollectionSummary[]> {
  const params = new URLSearchParams();
  if (collectionId) params.append("collection_id", collectionId);

  const res = await fetchWithErrorHandling(`${API_BASE}/collection_summary/list?${params}`, {}, "listCollectionSummaries");
  const data = await res.json();
  return data.summaries || [];
}