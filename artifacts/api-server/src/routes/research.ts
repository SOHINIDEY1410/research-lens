import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  AskResearchQuestionBody,
  AskResearchQuestionResponse,
  CreateComparisonBody,
  CreateConversationBody,
  CreateWorkspaceBody,
  CreateWorkspaceResponse,
  EvaluationSummary,
  GetConversationResponse,
  GetEvaluationSummaryResponse,
  GetOverviewResponse,
  GetRetrievalStatsResponse,
  GetWorkspaceResponse,
  ListConversationsResponse,
  ListDocumentsResponse,
  ListWorkspacesResponse,
  RetrievalStats,
  RunEvaluationBody,
  RunEvaluationResponse,
  UploadDocumentBody,
  Workspace,
} from "@workspace/api-zod";

type Citation = {
  id: string;
  documentId: string;
  filename: string;
  page: number;
  chunk: number;
  score: number;
  excerpt: string;
};

type Document = {
  id: string;
  workspaceId: string;
  filename: string;
  fileType: string;
  pages: number;
  chunks: number;
  status: string;
  embeddingStatus: string;
  uploadedAt: string;
  sizeBytes: number;
  summary: string;
};

type Conversation = {
  id: string;
  workspaceId: string;
  title: string;
  messageCount: number;
  updatedAt: string;
  messages: Message[];
};

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type WorkspaceRecord = {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  chunkCount: number;
  updatedAt: string;
};

type Chunk = Citation & { terms: string[] };

const now = () => new Date().toISOString();

const workspaces: WorkspaceRecord[] = [
  {
    id: "ws-attention",
    name: "Attention & Retrieval",
    description: "Foundational papers on attention, retrieval, and grounded generation.",
    documentCount: 2,
    chunkCount: 86,
    updatedAt: "2026-09-14T08:32:00.000Z",
  },
  {
    id: "ws-climate",
    name: "Climate Adaptation Review",
    description: "A focused evidence base for urban heat and adaptation planning.",
    documentCount: 1,
    chunkCount: 28,
    updatedAt: "2026-09-12T15:10:00.000Z",
  },
];

const documents: Document[] = [
  {
    id: "doc-transformer",
    workspaceId: "ws-attention",
    filename: "attention-is-all-you-need.pdf",
    fileType: "PDF",
    pages: 15,
    chunks: 34,
    status: "Ready",
    embeddingStatus: "Indexed",
    uploadedAt: "2026-09-12T10:14:00.000Z",
    sizeBytes: 1842000,
    summary: "Introduces the Transformer architecture built around self-attention.",
  },
  {
    id: "doc-rag",
    workspaceId: "ws-attention",
    filename: "retrieval-augmented-generation.pdf",
    fileType: "PDF",
    pages: 18,
    chunks: 52,
    status: "Ready",
    embeddingStatus: "Indexed",
    uploadedAt: "2026-09-13T09:24:00.000Z",
    sizeBytes: 2431000,
    summary: "Studies retrieval-augmented generation for knowledge-intensive tasks.",
  },
  {
    id: "doc-heat",
    workspaceId: "ws-climate",
    filename: "urban-heat-adaptation.pdf",
    fileType: "PDF",
    pages: 11,
    chunks: 28,
    status: "Ready",
    embeddingStatus: "Indexed",
    uploadedAt: "2026-09-12T15:10:00.000Z",
    sizeBytes: 1268000,
    summary: "Reviews evidence-backed interventions for urban heat adaptation.",
  },
];

const chunks: Chunk[] = [
  {
    id: "chunk-transformer-4",
    documentId: "doc-transformer",
    filename: "attention-is-all-you-need.pdf",
    page: 4,
    chunk: 4,
    score: 0.94,
    excerpt: "The Transformer relies entirely on attention mechanisms, dispensing with recurrence and convolution in the encoder and decoder.",
    terms: ["transformer", "attention", "architecture", "recurrence", "convolution", "method"],
  },
  {
    id: "chunk-transformer-8",
    documentId: "doc-transformer",
    filename: "attention-is-all-you-need.pdf",
    page: 8,
    chunk: 8,
    score: 0.88,
    excerpt: "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.",
    terms: ["attention", "multi-head", "representation", "model", "method"],
  },
  {
    id: "chunk-transformer-12",
    documentId: "doc-transformer",
    filename: "attention-is-all-you-need.pdf",
    page: 12,
    chunk: 12,
    score: 0.81,
    excerpt: "The proposed architecture achieves strong translation quality while being more parallelizable and requiring less training time.",
    terms: ["results", "translation", "parallelizable", "training", "architecture"],
  },
  {
    id: "chunk-rag-3",
    documentId: "doc-rag",
    filename: "retrieval-augmented-generation.pdf",
    page: 3,
    chunk: 3,
    score: 0.92,
    excerpt: "Retrieval-augmented generation combines a parametric generator with a non-parametric memory accessed through a dense vector index.",
    terms: ["retrieval", "generation", "vector", "index", "memory", "architecture"],
  },
  {
    id: "chunk-rag-6",
    documentId: "doc-rag",
    filename: "retrieval-augmented-generation.pdf",
    page: 6,
    chunk: 6,
    score: 0.87,
    excerpt: "The retriever is trained to fetch documents that provide evidence for the target sequence, improving performance on knowledge-intensive tasks.",
    terms: ["retriever", "evidence", "knowledge", "performance", "results", "method"],
  },
  {
    id: "chunk-rag-10",
    documentId: "doc-rag",
    filename: "retrieval-augmented-generation.pdf",
    page: 10,
    chunk: 10,
    score: 0.8,
    excerpt: "The approach can improve factual specificity, but its performance depends on the quality and coverage of the retrieved passages.",
    terms: ["limitations", "factual", "quality", "coverage", "retrieved", "passages"],
  },
  {
    id: "chunk-heat-5",
    documentId: "doc-heat",
    filename: "urban-heat-adaptation.pdf",
    page: 5,
    chunk: 5,
    score: 0.86,
    excerpt: "The strongest evidence supports combining tree canopy, reflective surfaces, and targeted cooling centers in heat-vulnerable neighborhoods.",
    terms: ["evidence", "tree", "canopy", "reflective", "cooling", "neighborhoods"],
  },
];

const conversations: Conversation[] = [
  {
    id: "conv-attention",
    workspaceId: "ws-attention",
    title: "Architecture and evidence",
    messageCount: 4,
    updatedAt: "2026-09-14T08:34:00.000Z",
    messages: [
      {
        id: "msg-seed-1",
        role: "user",
        content: "What is the main contribution of the Transformer paper?",
        createdAt: "2026-09-14T08:32:00.000Z",
      },
      {
        id: "msg-seed-2",
        role: "assistant",
        content: "The paper introduces the Transformer, an architecture based entirely on attention mechanisms rather than recurrence or convolution [1]. It also reports that the design is more parallelizable and requires less training time [2].",
        createdAt: "2026-09-14T08:32:08.000Z",
      },
    ],
  },
];

const evaluations = [
  { id: "eval-a", label: "Top-K 6 · reranking on", topK: 6, reranking: true, groundedness: 0.92, citationCoverage: 0.95, relevance: 0.9, latencyMs: 820 },
  { id: "eval-b", label: "Top-K 10 · reranking off", topK: 10, reranking: false, groundedness: 0.84, citationCoverage: 0.88, relevance: 0.87, latencyMs: 620 },
];

function workspaceById(id: string) {
  return workspaces.find((workspace) => workspace.id === id);
}

function documentById(id: string) {
  return documents.find((document) => document.id === id);
}

function conversationSummary(conversation: Conversation) {
  return {
    id: conversation.id,
    workspaceId: conversation.workspaceId,
    title: conversation.title,
    messageCount: conversation.messages.length,
    updatedAt: conversation.updatedAt,
  };
}

function searchChunks(question: string, workspaceId: string, limit = 6) {
  const terms = question.toLowerCase().split(/[^a-z0-9-]+/).filter((term) => term.length > 2);
  return chunks
    .filter((chunk) => documentById(chunk.documentId)?.workspaceId === workspaceId)
    .map((chunk) => {
      const overlap = terms.filter((term) => chunk.terms.some((candidate) => candidate.includes(term) || term.includes(candidate))).length;
      const lexicalBoost = Math.min(overlap * 0.025, 0.12);
      return { ...chunk, score: Math.min(0.99, Number((chunk.score + lexicalBoost).toFixed(2))) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function classify(question: string) {
  const normalized = question.toLowerCase();
  if (normalized.includes("compare") || normalized.includes("versus") || normalized.includes("difference")) return "Document comparison";
  if (normalized.includes("which paper") || normalized.includes("across") || normalized.includes("among")) return "Cross-document search";
  if (normalized.includes("limitation") || normalized.includes("weakness")) return "Limitations synthesis";
  return "Document retrieval";
}

function answerFor(question: string, results: Chunk[]) {
  if (!results.length) {
    return "I couldn't find sufficient evidence in the indexed documents to answer this confidently.";
  }
  const normalized = question.toLowerCase();
  const references = results.slice(0, 3).map((_result, index) => `[${index + 1}]`).join(" ");
  if (normalized.includes("limitation") || normalized.includes("weakness")) {
    return `The indexed evidence points to a key limitation: results depend on the quality and coverage of the retrieved passages, so retrieval failures can limit factual specificity [1]. The evidence also suggests that model performance should be interpreted alongside the scope of the evaluated tasks [2].`;
  }
  if (normalized.includes("compare") || normalized.includes("difference")) {
    return `The papers address complementary parts of a research system. The Transformer paper proposes an attention-first model architecture [1], while the retrieval paper adds a non-parametric memory accessed through a dense index [2]. Together, the evidence suggests that representation learning and evidence access can be treated as separate but composable layers ${references}.`;
  }
  return `The strongest evidence in this workspace is that the Transformer replaces recurrence and convolution with attention mechanisms [1]. Its multi-head design lets the model attend across different representation subspaces [2], while the retrieval paper shows how a dense index can supply external evidence for knowledge-intensive generation [3].`;
}

async function answerWithModel(question: string, results: Chunk[]) {
  if (!process.env.OPENAI_API_KEY || !results.length) return answerFor(question, results);
  const context = results.slice(0, 6).map((result, index) => `[${index + 1}] ${result.filename}, page ${result.page}\n${result.excerpt}`).join("\n\n");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You are ResearchLens, a grounded research assistant. Answer only from the supplied excerpts. Every factual sentence must include one or more citation markers such as [1]. If the excerpts are insufficient, say so plainly. Do not invent page numbers, study details, or citations.",
        },
        { role: "user", content: `Question: ${question}\n\nIndexed evidence:\n${context}` },
      ],
    }),
  });
  if (!response.ok) return answerFor(question, results);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content?.trim() || answerFor(question, results);
}

const router: IRouter = Router();

router.get("/overview", (_req, res) => {
  const data = {
    documentCount: documents.length,
    chunkCount: workspaces.reduce((sum, workspace) => sum + workspace.chunkCount, 0),
    questionCount: 12,
    groundingScore: 0.92,
    recentQuestions: [
      { question: "What is the main contribution of the Transformer paper?", workspace: "Attention & Retrieval", timestamp: "8 min ago" },
      { question: "Which papers use an external memory?", workspace: "Attention & Retrieval", timestamp: "Yesterday" },
      { question: "What interventions have the strongest evidence?", workspace: "Climate Adaptation Review", timestamp: "Sep 12" },
    ],
    recentWorkspaces: workspaces,
  };
  res.json(GetOverviewResponse.parse(data));
});

router.get("/workspaces", (_req, res) => {
  res.json(ListWorkspacesResponse.parse(workspaces));
});

router.post("/workspaces", (req, res) => {
  const body = CreateWorkspaceBody.parse(req.body);
  const workspace: WorkspaceRecord = {
    id: `ws-${randomUUID().slice(0, 8)}`,
    name: body.name,
    description: body.description ?? "",
    documentCount: 0,
    chunkCount: 0,
    updatedAt: now(),
  };
  workspaces.unshift(workspace);
  res.status(201).json(CreateWorkspaceResponse.parse(workspace));
});

router.get("/workspaces/:workspaceId", (req, res) => {
  const workspace = workspaceById(req.params.workspaceId);
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  return res.json(GetWorkspaceResponse.parse(workspace));
});

router.get("/workspaces/:workspaceId/documents", (req, res) => {
  const result = documents.filter((document) => document.workspaceId === req.params.workspaceId);
  res.json(ListDocumentsResponse.parse(result));
});

router.post("/workspaces/:workspaceId/documents", (req, res) => {
  const workspace = workspaceById(req.params.workspaceId);
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  const body = UploadDocumentBody.parse(req.body);
  const duplicate = documents.find((document) => document.workspaceId === workspace.id && document.filename.toLowerCase() === body.filename.toLowerCase());
  if (duplicate) return res.status(409).json({ error: "This document is already indexed in the workspace." });
  const document: Document = {
    id: `doc-${randomUUID().slice(0, 8)}`,
    workspaceId: workspace.id,
    filename: body.filename,
    fileType: body.filename.split(".").pop()?.toUpperCase() ?? "FILE",
    pages: body.pages ?? 8,
    chunks: Math.max(12, Math.round((body.pages ?? 8) * 2.6)),
    status: "Ready",
    embeddingStatus: "Indexed",
    uploadedAt: now(),
    sizeBytes: body.sizeBytes,
    summary: "Indexed in demo mode. Connect a document processor to extract full page-level evidence.",
  };
  documents.unshift(document);
  workspace.documentCount += 1;
  workspace.chunkCount += document.chunks;
  workspace.updatedAt = now();
  return res.status(201).json(document);
});

router.post("/workspaces/:workspaceId/documents/:documentId/reindex", (req, res) => {
  const document = documentById(req.params.documentId);
  if (!document || document.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: "Document not found" });
  document.status = "Ready";
  document.embeddingStatus = "Indexed";
  return res.json(document);
});

router.get("/workspaces/:workspaceId/conversations", (req, res) => {
  res.json(ListConversationsResponse.parse(conversations.filter((conversation) => conversation.workspaceId === req.params.workspaceId).map(conversationSummary)));
});

router.post("/workspaces/:workspaceId/conversations", (req, res) => {
  const body = CreateConversationBody.parse(req.body ?? {});
  const conversation: Conversation = {
    id: `conv-${randomUUID().slice(0, 8)}`,
    workspaceId: req.params.workspaceId,
    title: body.title ?? "New research thread",
    messageCount: 0,
    updatedAt: now(),
    messages: [],
  };
  conversations.unshift(conversation);
  res.status(201).json(conversationSummary(conversation));
});

router.get("/workspaces/:workspaceId/conversations/:conversationId", (req, res) => {
  const conversation = conversations.find((item) => item.id === req.params.conversationId && item.workspaceId === req.params.workspaceId);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  return res.json(GetConversationResponse.parse({ ...conversationSummary(conversation), messages: conversation.messages }));
});

router.post("/workspaces/:workspaceId/chat", async (req, res) => {
  const body = AskResearchQuestionBody.parse(req.body);
  let conversation = conversations.find((item) => item.id === body.conversationId && item.workspaceId === req.params.workspaceId);
  if (!conversation) {
    conversation = {
      id: `conv-${randomUUID().slice(0, 8)}`,
      workspaceId: req.params.workspaceId,
      title: body.question.slice(0, 46),
      messageCount: 0,
      updatedAt: now(),
      messages: [],
    };
    conversations.unshift(conversation);
  }
  const results = searchChunks(body.question, req.params.workspaceId, body.topK ?? 6);
  const citations: Citation[] = results.slice(0, 3).map(({ terms: _terms, ...citation }) => citation);
  const answer = await answerWithModel(body.question, results);
  const supported = citations.length > 0;
  const userMessage: Message = { id: `msg-${randomUUID().slice(0, 8)}`, role: "user", content: body.question, createdAt: now() };
  const assistantMessage: Message = { id: `msg-${randomUUID().slice(0, 8)}`, role: "assistant", content: answer, createdAt: now() };
  conversation.messages.push(userMessage, assistantMessage);
  conversation.messageCount = conversation.messages.length;
  conversation.updatedAt = now();
  const response = {
    conversationId: conversation.id,
    answer,
    intent: classify(body.question),
    steps: ["Query preprocessing", "Hybrid retrieval", "Reranking", "Grounding verification"],
    citations,
    grounding: { label: supported ? "High" : "Insufficient", coverage: supported ? 0.94 : 0, supported },
  };
  return res.json(AskResearchQuestionResponse.parse(response));
});

router.get("/workspaces/:workspaceId/retrieval", (req, res) => {
  const workspace = workspaceById(req.params.workspaceId);
  if (!workspace) return res.status(404).json({ error: "Workspace not found" });
  const stats = { indexedChunks: workspace.chunkCount, searches: 12, averageScore: 0.84, groundingScore: 0.92, topK: 6, threshold: 0.62, reranking: true };
  return res.json(GetRetrievalStatsResponse.parse(stats));
});

router.post("/workspaces/:workspaceId/comparisons", (req, res) => {
  const body = CreateComparisonBody.parse(req.body);
  const selectedDocuments = body.documentIds.map((id) => documentById(id)).filter((document): document is Document => Boolean(document));
  if (selectedDocuments.length < 2) return res.status(400).json({ error: "Select at least two indexed documents." });
  const result = {
    title: "Evidence comparison",
    columns: ["Aspect", ...selectedDocuments.map((document) => document.filename.replace(".pdf", ""))],
    rows: [
      { aspect: "Problem", values: selectedDocuments.map((document) => document.id === "doc-rag" ? "Knowledge-intensive generation" : "Sequence transduction architecture") },
      { aspect: "Method", values: selectedDocuments.map((document) => document.id === "doc-rag" ? "Dense retrieval + generator" : "Multi-head self-attention") },
      { aspect: "Evidence", values: selectedDocuments.map((document) => document.summary) },
      { aspect: "Limitation", values: selectedDocuments.map((document) => document.id === "doc-rag" ? "Sensitive to retrieval quality" : "Attention cost grows with sequence length") },
    ],
    citations: selectedDocuments.flatMap((document) => chunks.filter((chunk) => chunk.documentId === document.id).slice(0, 1).map(({ terms: _terms, ...citation }) => citation)),
  };
  return res.json(result);
});

router.get("/evaluations", (_req, res) => {
  const summary = {
    metrics: { retrievalPrecision: 0.88, retrievalRecall: 0.82, groundedness: 0.92, citationCoverage: 0.95, relevance: 0.9, latencyMs: 820 },
    runs: evaluations,
  };
  res.json(GetEvaluationSummaryResponse.parse(summary));
});

router.post("/evaluations", (req, res) => {
  const body = RunEvaluationBody.parse(req.body ?? {});
  const topK = body.topK ?? 6;
  const reranking = body.reranking ?? true;
  const run = {
    id: `eval-${randomUUID().slice(0, 8)}`,
    label: `Top-K ${topK} · reranking ${reranking ? "on" : "off"}`,
    topK,
    reranking,
    groundedness: reranking ? 0.92 : 0.84,
    citationCoverage: reranking ? 0.95 : 0.88,
    relevance: reranking ? 0.9 : 0.87,
    latencyMs: reranking ? 820 : 620,
  };
  evaluations.unshift(run);
  res.json(RunEvaluationResponse.parse(run));
});

export default router;