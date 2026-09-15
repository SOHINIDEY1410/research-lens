import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ArrowUpRight, BarChart3, BookOpen, Check, CircleAlert, FileText, FolderOpen, Gauge, Info, Layers3, LibraryBig, Menu, Plus, RefreshCw, Search, Send, Settings2, SlidersHorizontal, Sparkles, Upload, X } from 'lucide-react';
import { getGetConversationQueryKey, getGetEvaluationSummaryQueryKey, getGetOverviewQueryKey, getGetRetrievalStatsQueryKey, getGetWorkspaceQueryKey, getListConversationsQueryKey, getListDocumentsQueryKey, getListWorkspacesQueryKey, setBaseUrl, useAskResearchQuestion, useCreateComparison, useCreateConversation, useCreateWorkspace, useGetConversation, useGetEvaluationSummary, useGetOverview, useGetRetrievalStats, useGetWorkspace, useListConversations, useListDocuments, useListWorkspaces, useReindexDocument, useRunEvaluation, useUploadDocument } from '@workspace/api-client-react';
import type { Document } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) setBaseUrl(apiUrl);

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function formatBytes(value?: number) {
  if (!value) return '—';
  return value > 1000000 ? `${(value / 1000000).toFixed(1)} MB` : `${Math.round(value / 1000)} KB`;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Wordmark() {
  return <Link href="/" className="flex items-center gap-3" data-testid="link-home">
    <span className="brand-mark" aria-hidden="true"><span /></span>
    <span className="font-serif text-[20px] tracking-[-0.04em] text-sidebar-foreground">Research<span className="text-accent">Lens</span></span>
  </Link>;
}

const navItems = [
  { href: '/', label: 'Overview', icon: Gauge },
  { href: '/comparisons', label: 'Comparisons', icon: Layers3 },
  { href: '/evaluation', label: 'Evaluation lab', icon: BarChart3 },
];

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-[100dvh] bg-background">
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform duration-200 md:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex items-center justify-between px-3 pb-9"><Wordmark /><button className="icon-button md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-sidebar"><X size={17} /></button></div>
      <div className="px-3 pb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/45">Research desk</div>
      <nav className="space-y-1" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn('nav-link', location === href && 'nav-link-active')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>)}
      </nav>
      <div className="mt-8 px-3 pb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/45">Workspace</div>
      <Link href="/" className="nav-link text-sidebar-foreground/70" data-testid="link-all-workspaces"><LibraryBig size={17} strokeWidth={1.8} /><span>All workspaces</span></Link>
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <Link href="/settings" className={cn('nav-link', location === '/settings' && 'nav-link-active')} data-testid="link-nav-settings"><Settings2 size={17} strokeWidth={1.8} /><span>Settings</span></Link>
        <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-3 text-sidebar-foreground/65">
          <span className="avatar">AR</span><div className="min-w-0"><div className="truncate text-xs font-medium text-sidebar-foreground">Avery Ross</div><div className="truncate text-[11px]">Independent researcher</div></div>
        </div>
      </div>
    </aside>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-dismiss-sidebar" />}
    <main className="min-h-[100dvh] md:pl-[250px]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
        <button className="icon-button md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-sidebar"><Menu size={20} /></button>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><span className="signal-dot" />Workspace synced <span className="mx-1 text-border">/</span> <span className="font-mono text-[11px]">v0.8.4</span></div>
        <div className="ml-auto flex items-center gap-2"><button className="icon-button" title="Search" data-testid="button-global-search"><Search size={17} /></button><Link href="/settings" className="icon-button" title="Settings" data-testid="link-header-settings"><SlidersHorizontal size={17} /></Link></div>
      </header>
      <div className="page-wrap">{children}</div>
    </main>
  </div>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1 className="mt-1 font-serif text-[34px] leading-tight tracking-[-0.04em] text-foreground sm:text-[42px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>
    {action && <div className="shrink-0">{action}</div>}
  </div>;
}

function LoadingState({ label = 'Gathering your research surface' }: { label?: string }) {
  return <div className="space-y-3" data-testid="state-loading"><div className="skeleton h-6 w-40" /><div className="skeleton h-24 w-full" /><div className="skeleton h-16 w-full" /><p className="pt-1 text-xs text-muted-foreground">{label}…</p></div>;
}

function ErrorState({ onRetry, label = 'We could not load this view.' }: { onRetry?: () => void; label?: string }) {
  return <div className="empty-panel" data-testid="state-error"><CircleAlert size={23} className="text-destructive" /><h3 className="mt-4 font-serif text-xl">{label}</h3><p className="mt-1 text-sm text-muted-foreground">Check the connection, then try again.</p>{onRetry && <button className="button button-secondary mt-5" onClick={onRetry} data-testid="button-retry"><RefreshCw size={14} />Retry</button>}</div>;
}

function StatCard({ label, value, suffix, accent }: { label: string; value: string | number; suffix?: string; accent?: boolean }) {
  return <div className={cn('stat-card', accent && 'stat-card-accent')}><div className="flex items-center justify-between"><span className="eyebrow !text-[10px]">{label}</span><ArrowUpRight size={15} className="text-muted-foreground/50" /></div><div className="mt-4 font-mono text-[27px] tracking-[-0.05em]">{value}{suffix && <span className="ml-1 text-sm text-muted-foreground">{suffix}</span>}</div></div>;
}

function Dashboard() {
  const overview = useGetOverview();
  const workspaces = useListWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const saveWorkspace = () => { if (!name.trim()) return; createWorkspace.mutate({ data: { name: name.trim(), description } }, { onSuccess: () => { setName(''); setDescription(''); setShowCreate(false); qc.invalidateQueries({ queryKey: getListWorkspacesQueryKey() }); qc.invalidateQueries({ queryKey: getGetOverviewQueryKey() }); } }); };
  if (overview.isLoading || workspaces.isLoading) return <LoadingState />;
  if (overview.isError || workspaces.isError) return <ErrorState onRetry={() => { overview.refetch(); workspaces.refetch(); }} />;
  const data = overview.data;
  const workspaceList = workspaces.data ?? data?.recentWorkspaces ?? [];
  return <div className="animate-enter">
    <SectionHeading eyebrow="Tuesday, October 24" title="Your research desk" description="A quiet view of what you have read, asked, and grounded so far." action={<button className="button button-primary" onClick={() => setShowCreate((v) => !v)} data-testid="button-new-workspace"><Plus size={16} />New workspace</button>} />
    {showCreate && <div className="mb-7 rounded-xl border border-accent/50 bg-accent/10 p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-serif text-lg">Start a new line of inquiry</h2><p className="mt-1 text-xs text-muted-foreground">Keep the scope narrow. You can always add another workspace.</p></div><button className="icon-button" onClick={() => setShowCreate(false)} data-testid="button-cancel-workspace"><X size={16} /></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" className="input" data-testid="input-workspace-name" /><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you investigating?" className="input" data-testid="input-workspace-description" /></div><button className="button button-primary mt-4" disabled={createWorkspace.isPending || !name.trim()} onClick={saveWorkspace} data-testid="button-create-workspace">{createWorkspace.isPending ? 'Creating…' : 'Create workspace'}</button></div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
       <StatCard label="Documents" value={data?.documentCount ?? 0} suffix="files" /><StatCard label="Indexed chunks" value={data?.chunkCount ?? 0} /><StatCard label="Questions asked" value={data?.questionCount ?? 0} /><StatCard label="Grounding score" value={`${Math.round((data?.groundingScore ?? 0) * 100)}`} suffix="%" accent />
    </div>
    <div className="mt-10 grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
      <section><div className="mb-4 flex items-center justify-between"><div><div className="eyebrow">Active surfaces</div><h2 className="mt-1 font-serif text-[23px]">Your workspaces</h2></div><span className="font-mono text-[11px] text-muted-foreground">{workspaceList.length.toString().padStart(2, '0')} total</span></div>
        {workspaceList.length === 0 ? <div className="empty-panel"><FolderOpen size={22} className="text-primary" /><h3 className="mt-3 font-serif text-lg">No workspace yet</h3><p className="mt-1 text-sm text-muted-foreground">Create a focused home for your next question.</p></div> : <div className="space-y-2">{workspaceList.map((workspace, index) => <Link href={`/workspace/${workspace.id}`} key={workspace.id} className="workspace-row" data-testid={`card-workspace-${workspace.id}`}><span className="workspace-index">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{workspace.name}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{workspace.description || 'No description yet'}</span></span><span className="hidden text-right text-xs text-muted-foreground sm:block"><span className="block font-mono text-foreground">{workspace.documentCount}</span> documents</span><span className="hidden text-right text-xs text-muted-foreground md:block"><span className="block font-mono text-foreground">{workspace.chunkCount}</span> chunks</span><span className="pl-3 text-muted-foreground"><ArrowUpRight size={17} /></span></Link>)}</div>}
      </section>
      <section><div className="mb-4"><div className="eyebrow">Recent questions</div><h2 className="mt-1 font-serif text-[23px]">A trail of inquiry</h2></div><div className="surface-card divide-y divide-border/70">{(data?.recentQuestions ?? []).length === 0 ? <div className="p-6 text-sm text-muted-foreground">Questions will appear here as you investigate.</div> : data?.recentQuestions.map((q, i) => <div key={`${q.question}-${i}`} className="px-5 py-4"><p className="line-clamp-2 text-sm leading-5 text-foreground">“{q.question}”</p><div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>{q.workspace}</span><span className="font-mono">{formatDate(q.timestamp)}</span></div></div>)}</div></section>
    </div>
     <section className="mt-10"><div className="mb-4 flex items-end justify-between"><div><div className="eyebrow">System readout</div><h2 className="mt-1 font-serif text-[23px]">Retrieval health</h2></div><span className="flex items-center gap-2 text-xs text-primary"><span className="signal-dot" />All systems nominal</span></div><div className="health-panel"><div className="health-orbit"><div className="health-ring ring-one" /><div className="health-ring ring-two" /><div className="health-core"><Check size={22} /></div></div><div className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4"><div><div className="font-mono text-xl">{data?.chunkCount ?? 0}</div><div className="mt-1 text-xs text-muted-foreground">indexed chunks</div></div><div><div className="font-mono text-xl">{Math.round((data?.groundingScore ?? 0) * 100)}%</div><div className="mt-1 text-xs text-muted-foreground">grounding avg.</div></div><div><div className="font-mono text-xl">0.82</div><div className="mt-1 text-xs text-muted-foreground">retrieval precision</div></div><div><div className="font-mono text-xl">240ms</div><div className="mt-1 text-xs text-muted-foreground">median latency</div></div></div><Link href="/evaluation" className="button button-ghost self-start" data-testid="link-view-evaluation">View evaluation <ArrowUpRight size={14} /></Link></div></section>
  </div>;
}

function DocumentCard({ document, onReindex }: { document: Document; onReindex: (id: string) => void }) {
  const ready = document.embeddingStatus.toLowerCase().includes('complete') || document.embeddingStatus.toLowerCase().includes('ready') || document.status.toLowerCase().includes('complete');
  return <div className="document-row" data-testid={`card-document-${document.id}`}><div className="file-icon"><FileText size={19} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="truncate text-sm">{document.filename}</strong><span className="file-type">{document.fileType || 'PDF'}</span></div><div className="mt-1 truncate text-xs text-muted-foreground">{document.pages || '—'} pages <span className="px-1 text-border">·</span> {document.chunks || 0} chunks <span className="px-1 text-border">·</span> {formatBytes(document.sizeBytes)}</div></div><div className={cn('status-pill hidden sm:flex', ready ? 'status-ready' : 'status-indexing')}><span className="status-dot" />{ready ? 'Ready' : document.embeddingStatus || 'Indexing'}</div><button className="icon-button" title="Reindex document" onClick={() => onReindex(document.id)} data-testid={`button-reindex-${document.id}`}><RefreshCw size={15} /></button></div>;
}

function WorkspacePage() {
  const { id = '' } = useParams<{ id: string }>();
  const workspace = useGetWorkspace(id);
  const documents = useListDocuments(id);
  const conversations = useListConversations(id);
  const stats = useGetRetrievalStats(id);
  const upload = useUploadDocument();
  const reindex = useReindexDocument();
  const ask = useAskResearchQuestion();
  const createConversation = useCreateConversation();
  const qc = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ answer: string; citations: Array<{ id: string; filename: string; page: number; score: number; excerpt: string }>; grounding: { label: string; coverage: number; supported: boolean }; steps: string[] } | null>(null);
  const conversation = useGetConversation(id, selectedConversation || 'none', { query: { enabled: Boolean(selectedConversation), queryKey: getGetConversationQueryKey(id, selectedConversation || 'none') } });
  const documentList = documents.data ?? [];
  const conversationList = conversations.data ?? [];
  const submitQuestion = () => { if (!question.trim() || ask.isPending) return; const send = (conversationId?: string) => ask.mutate({ workspaceId: id, data: { question: question.trim(), conversationId: conversationId || null, topK: stats.data?.topK ?? 6, similarityThreshold: stats.data?.threshold ?? 0.62 } }, { onSuccess: (result) => { setAnswer(result); setQuestion(''); qc.invalidateQueries({ queryKey: getListConversationsQueryKey(id) }); } }); if (!selectedConversation && !conversationList.length) createConversation.mutate({ workspaceId: id, data: { title: question.trim().slice(0, 64) } }, { onSuccess: (created) => { setSelectedConversation(created.id); send(created.id); } }); else send(selectedConversation || undefined); };
  const uploadFile = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; upload.mutate({ workspaceId: id, data: { filename: file.name, sizeBytes: file.size, pages: 1 } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListDocumentsQueryKey(id) }); qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey(id) }); } }); };
  if (workspace.isLoading || documents.isLoading || conversations.isLoading || stats.isLoading) return <LoadingState label="Opening workspace" />;
  if (workspace.isError || documents.isError || conversations.isError || stats.isError || !workspace.data) return <ErrorState onRetry={() => { workspace.refetch(); documents.refetch(); conversations.refetch(); stats.refetch(); }} />;
  return <div className="animate-enter">
    <div className="mb-7 flex items-start gap-3"><Link href="/" className="icon-button mt-1" data-testid="link-back-overview"><ArrowUpRight size={16} className="rotate-[225deg]" /></Link><div className="min-w-0 flex-1"><div className="eyebrow">Research workspace</div><h1 className="mt-1 truncate font-serif text-[34px] tracking-[-0.04em] sm:text-[42px]" data-testid="text-workspace-name">{workspace.data.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{workspace.data.description || 'A focused space for evidence-grounded inquiry.'}</p></div><label className="button button-primary cursor-pointer"><Upload size={16} />{upload.isPending ? 'Indexing…' : 'Add document'}<input type="file" className="sr-only" accept=".pdf,.txt,.doc,.docx" onChange={uploadFile} data-testid="input-upload-document" /></label></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="space-y-6"><section className="surface-card overflow-hidden"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4"><div><div className="eyebrow">Context library</div><h2 className="mt-1 font-serif text-xl">Documents <span className="font-mono text-sm text-muted-foreground">{documentList.length.toString().padStart(2, '0')}</span></h2></div><button className="icon-button" title="Refresh documents" onClick={() => documents.refetch()} data-testid="button-refresh-documents"><RefreshCw size={16} /></button></div>{documentList.length === 0 ? <div className="empty-panel border-0 rounded-none"><FileText size={22} className="text-primary" /><h3 className="mt-3 font-serif text-lg">Your library is waiting</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Upload the papers you want to reason across. ResearchLens will turn them into retrievable evidence.</p><label className="button button-secondary mt-5 cursor-pointer"><Upload size={14} />Choose a paper<input type="file" className="sr-only" onChange={uploadFile} data-testid="input-upload-empty" /></label></div> : <div className="divide-y divide-border/70">{documentList.map((doc) => <DocumentCard key={doc.id} document={doc} onReindex={(documentId) => reindex.mutate({ workspaceId: id, documentId }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListDocumentsQueryKey(id) }) })} />)}</div>}</section>
        <section className="surface-card"><div className="border-b border-border/70 px-5 py-4"><div className="eyebrow">Ask the corpus</div><h2 className="mt-1 font-serif text-xl">Evidence-grounded conversation</h2></div><div className="min-h-[230px] space-y-4 p-5">{conversation.data?.messages.map((message) => <div key={message.id} className={cn('flex gap-3', message.role === 'user' && 'justify-end')}><div className={cn('max-w-[88%] rounded-xl px-4 py-3 text-sm leading-6', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')} data-testid={`message-${message.id}`}>{message.content}</div></div>)}{answer && <div className="space-y-3" data-testid="panel-answer"><div className="flex gap-3"><span className="avatar avatar-lens">RL</span><div className="flex-1 rounded-xl bg-muted px-4 py-3 text-sm leading-6">{answer.answer}<div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3"><span className="grounding-badge"><Check size={12} />{answer.grounding.label} · {Math.round(answer.grounding.coverage * 100)}% coverage</span>{answer.citations.slice(0, 3).map((citation) => <span key={citation.id} className="citation-chip">[{citation.page}] {citation.filename}</span>)}</div></div></div></div>}{ask.isPending && <div className="flex gap-3"><span className="avatar avatar-lens">RL</span><div className="answer-loading"><span /><span /><span /></div></div>}{!conversation.data?.messages.length && !answer && !ask.isPending && <div className="flex min-h-[155px] flex-col items-center justify-center text-center"><Sparkles size={21} className="text-accent" /><p className="mt-3 font-serif text-lg">What would you like to understand?</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Ask for a synthesis, a contradiction, or the precise evidence behind a claim.</p></div>}</div><div className="border-t border-border/70 p-4"><div className="relative"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitQuestion(); }} className="input min-h-[78px] resize-none pr-12" placeholder="Ask a question of your documents…" data-testid="input-research-question" /><button className="button button-primary absolute bottom-3 right-3 !h-8 !w-8 !p-0" onClick={submitQuestion} disabled={!question.trim() || ask.isPending} title="Ask question" data-testid="button-ask-question"><Send size={14} /></button></div><div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>⌘ Enter to ask</span><span className="font-mono">topK {stats.data?.topK ?? 6} · threshold {stats.data?.threshold?.toFixed(2) ?? '0.62'}</span></div></div></section></div>
      <aside className="space-y-6"><section className="surface-card"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4"><div><div className="eyebrow">Recent threads</div><h2 className="mt-1 font-serif text-lg">Conversations</h2></div><button className="icon-button" onClick={() => createConversation.mutate({ workspaceId: id, data: { title: 'Untitled inquiry' } }, { onSuccess: (created) => { setSelectedConversation(created.id); qc.invalidateQueries({ queryKey: getListConversationsQueryKey(id) }); } })} data-testid="button-new-conversation"><Plus size={16} /></button></div><div className="divide-y divide-border/60">{conversationList.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Your first question will start a thread.</p> : conversationList.map((item) => <button key={item.id} className={cn('conversation-row', selectedConversation === item.id && 'conversation-row-active')} onClick={() => { setSelectedConversation(item.id); setAnswer(null); }} data-testid={`button-conversation-${item.id}`}><span className="min-w-0 flex-1 truncate text-left text-xs">{item.title}</span><span className="font-mono text-[10px] text-muted-foreground">{item.messageCount}</span></button>)}</div></section><section className="surface-card p-5"><div className="flex items-center justify-between"><div className="eyebrow">Retrieval health</div><span className="signal-dot" /></div><div className="mt-4 grid grid-cols-2 gap-4"><div><div className="font-mono text-xl">{stats.data?.indexedChunks ?? 0}</div><div className="mt-1 text-[11px] text-muted-foreground">indexed chunks</div></div><div><div className="font-mono text-xl">{stats.data?.searches ?? 0}</div><div className="mt-1 text-[11px] text-muted-foreground">searches</div></div><div><div className="font-mono text-xl">{stats.data?.averageScore?.toFixed(2) ?? '—'}</div><div className="mt-1 text-[11px] text-muted-foreground">avg. score</div></div><div><div className="font-mono text-xl">{stats.data?.reranking ? 'On' : 'Off'}</div><div className="mt-1 text-[11px] text-muted-foreground">re-ranking</div></div></div></section><section className="callout"><Info size={17} /><div><strong className="text-xs">Grounding is visible by design.</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">Every answer carries its source trail, so synthesis never loses contact with the page.</p></div></section></aside>
    </div>
  </div>;
}

function ComparisonsPage() {
  const workspaces = useListWorkspaces();
  const [workspaceId, setWorkspaceId] = useState('');
  const documents = useListDocuments(workspaceId || (workspaces.data?.[0]?.id ?? ''));
  const create = useCreateComparison();
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<{ title: string; columns: string[]; rows: Array<{ aspect: string; values: string[] }>; citations: Array<{ id: string; filename: string; page: number }> } | null>(null);
  const activeWorkspace = workspaceId || workspaces.data?.[0]?.id || '';
  const toggle = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const run = () => { if (selected.length < 2 || !activeWorkspace) return; create.mutate({ workspaceId: activeWorkspace, data: { documentIds: selected } }, { onSuccess: setResult }); };
  if (workspaces.isLoading) return <LoadingState label="Loading comparison sources" />;
  if (workspaces.isError) return <ErrorState onRetry={() => workspaces.refetch()} />;
  return <div className="animate-enter"><SectionHeading eyebrow="Synthesis tool" title="Compare evidence" description="Place papers side by side and let the differences become legible." action={<select value={activeWorkspace} onChange={(e) => { setWorkspaceId(e.target.value); setSelected([]); setResult(null); }} className="select" data-testid="select-comparison-workspace">{(workspaces.data ?? []).map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select>} /><div className="grid gap-6 xl:grid-cols-[300px_1fr]"><section className="surface-card"><div className="border-b border-border/70 px-5 py-4"><div className="eyebrow">Choose sources</div><h2 className="mt-1 font-serif text-lg">Documents <span className="font-mono text-xs text-muted-foreground">({selected.length}/2+)</span></h2></div><div className="divide-y divide-border/60">{(documents.data ?? []).length === 0 ? <p className="p-5 text-sm text-muted-foreground">Add documents to this workspace first.</p> : documents.data?.map((doc) => <button key={doc.id} onClick={() => toggle(doc.id)} className={cn('select-document', selected.includes(doc.id) && 'select-document-active')} data-testid={`button-select-document-${doc.id}`}><span className={cn('check-box', selected.includes(doc.id) && 'check-box-active')}>{selected.includes(doc.id) && <Check size={12} />}</span><span className="min-w-0 text-left"><strong className="block truncate text-xs">{doc.filename}</strong><span className="mt-1 block text-[10px] text-muted-foreground">{doc.pages} pages · {doc.chunks} chunks</span></span></button>)}</div><div className="border-t border-border/70 p-4"><button className="button button-primary w-full justify-center" disabled={selected.length < 2 || create.isPending} onClick={run} data-testid="button-run-comparison">{create.isPending ? 'Comparing…' : 'Compare selected'}<ArrowUpRight size={14} /></button></div></section><section className="surface-card min-h-[420px] overflow-hidden">{!result ? <div className="empty-panel min-h-[420px] border-0 rounded-none"><div className="compare-glyph"><span /><span /><span /></div><h2 className="mt-5 font-serif text-2xl">A clearer line between papers</h2><p className="mt-2 max-w-md text-center text-sm leading-6 text-muted-foreground">Select two or more sources to compare their methods, claims, and points of tension with citations attached.</p></div> : <div><div className="border-b border-border/70 px-5 py-5"><div className="eyebrow">Grounded comparison</div><h2 className="mt-1 font-serif text-2xl">{result.title}</h2></div><div className="overflow-x-auto"><table className="comparison-table"><thead><tr><th>Aspect</th>{result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{result.rows.map((row) => <tr key={row.aspect}><th>{row.aspect}</th>{row.values.map((value, index) => <td key={`${row.aspect}-${index}`}>{value}</td>)}</tr>)}</tbody></table></div><div className="border-t border-border/70 bg-muted/40 px-5 py-4"><div className="eyebrow">Source trail</div><div className="mt-2 flex flex-wrap gap-2">{result.citations.map((citation) => <span className="citation-chip" key={citation.id}>[{citation.page}] {citation.filename}</span>)}</div></div></div>}</section></div></div>;
}

function EvaluationPage() {
  const summary = useGetEvaluationSummary();
  const runEvaluation = useRunEvaluation();
  const qc = useQueryClient();
  const [topK, setTopK] = useState('6');
  const [threshold, setThreshold] = useState('0.62');
  const [reranking, setReranking] = useState(true);
  const metrics = summary.data?.metrics;
  const run = () => runEvaluation.mutate({ data: { topK: Number(topK), threshold: Number(threshold), reranking } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetEvaluationSummaryQueryKey() }) });
  if (summary.isLoading) return <LoadingState label="Loading evaluation history" />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;
  return <div className="animate-enter"><SectionHeading eyebrow="Instrument panel" title="Evaluation lab" description="Tune retrieval against a stable question set. The goal is not a prettier answer — it is a defensible one." action={<button className="button button-primary" onClick={run} disabled={runEvaluation.isPending} data-testid="button-run-evaluation"><RefreshCw size={15} />{runEvaluation.isPending ? 'Running…' : 'Run experiment'}</button>} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><StatCard label="Retrieval precision" value={`${Math.round((metrics?.retrievalPrecision ?? 0) * 100)}`} suffix="%" accent /><StatCard label="Citation coverage" value={`${Math.round((metrics?.citationCoverage ?? 0) * 100)}`} suffix="%" /><StatCard label="Median latency" value={metrics?.latencyMs ?? '—'} suffix="ms" /></div><div className="mt-8 grid gap-6 xl:grid-cols-[.72fr_1.28fr]"><section className="surface-card p-5"><div className="eyebrow">Experiment controls</div><h2 className="mt-1 font-serif text-xl">Retrieval defaults</h2><div className="mt-6 space-y-5"><label className="field-label">Top K <span className="field-value">{topK}</span><input type="range" min="1" max="20" value={topK} onChange={(e) => setTopK(e.target.value)} className="range" data-testid="input-evaluation-topk" /></label><label className="field-label">Similarity threshold <span className="field-value">{threshold}</span><input type="range" min="0" max="1" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="range" data-testid="input-evaluation-threshold" /></label><label className="toggle-row"><span><strong className="block text-sm">Re-ranking</strong><span className="mt-1 block text-xs text-muted-foreground">Use a second pass to order evidence.</span></span><button className={cn('toggle', reranking && 'toggle-on')} onClick={() => setReranking((v) => !v)} role="switch" aria-checked={reranking} data-testid="button-toggle-reranking"><span /></button></label></div></section><section className="surface-card overflow-hidden"><div className="border-b border-border/70 px-5 py-4"><div className="eyebrow">Run history</div><h2 className="mt-1 font-serif text-xl">Experiments</h2></div>{(summary.data?.runs ?? []).length === 0 ? <div className="empty-panel border-0 rounded-none"><BarChart3 size={22} className="text-primary" /><p className="mt-3 text-sm text-muted-foreground">No experiments recorded yet.</p></div> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Run</th><th>Config</th><th>Groundedness</th><th>Citations</th><th>Latency</th></tr></thead><tbody>{summary.data?.runs.map((item) => <tr key={item.id}><td><strong>{item.label}</strong></td><td className="font-mono text-xs">k={item.topK} · {item.reranking ? 'rerank' : 'direct'}</td><td><span className="metric-value">{Math.round(item.groundedness * 100)}%</span></td><td>{Math.round(item.citationCoverage * 100)}%</td><td className="font-mono">{item.latencyMs}ms</td></tr>)}</tbody></table></div>}</section></div></div>;
}

function SettingsPage() {
  const [topK, setTopK] = useState('6');
  const [threshold, setThreshold] = useState('0.62');
  const [reranking, setReranking] = useState(true);
  const [saved, setSaved] = useState(false);
  return <div className="animate-enter max-w-[900px]"><SectionHeading eyebrow="Workspace preferences" title="Settings" description="Decide how ResearchLens gathers evidence before it writes an answer." /><div className="space-y-5"><section className="surface-card p-6"><div className="flex gap-4"><div className="settings-icon"><SlidersHorizontal size={18} /></div><div><h2 className="font-serif text-xl">Retrieval defaults</h2><p className="mt-1 text-sm text-muted-foreground">These values apply to new research questions across your workspaces.</p></div></div><div className="mt-7 grid gap-6 sm:grid-cols-2"><label className="field-label">Evidence returned <span className="field-value">{topK} chunks</span><input type="range" min="1" max="20" value={topK} onChange={(e) => { setTopK(e.target.value); setSaved(false); }} className="range" data-testid="input-settings-topk" /><span className="mt-2 block text-xs font-normal text-muted-foreground">More chunks widen context; fewer keep answers tight.</span></label><label className="field-label">Minimum similarity <span className="field-value">{threshold}</span><input type="range" min="0" max="1" step="0.01" value={threshold} onChange={(e) => { setThreshold(e.target.value); setSaved(false); }} className="range" data-testid="input-settings-threshold" /><span className="mt-2 block text-xs font-normal text-muted-foreground">Raise this when answers feel too speculative.</span></label></div><div className="mt-7 border-t border-border/70 pt-5"><label className="toggle-row"><span><strong className="block text-sm">Rerank retrieved evidence</strong><span className="mt-1 block text-xs text-muted-foreground">Adds a semantic ordering pass for more precise citations.</span></span><button className={cn('toggle', reranking && 'toggle-on')} onClick={() => { setReranking((v) => !v); setSaved(false); }} role="switch" aria-checked={reranking} data-testid="button-settings-reranking"><span /></button></label></div></section><section className="surface-card p-6"><div className="flex items-center gap-4"><div className="settings-icon"><BookOpen size={18} /></div><div><h2 className="font-serif text-xl">Reading surface</h2><p className="mt-1 text-sm text-muted-foreground">A few preferences for a long research session.</p></div></div><div className="mt-6 divide-y divide-border/70"><div className="toggle-row py-4"><span><strong className="block text-sm">Show source excerpts</strong><span className="mt-1 block text-xs text-muted-foreground">Keep the quoted context visible under each answer.</span></span><span className="toggle toggle-on"><span /></span></div><div className="toggle-row py-4"><span><strong className="block text-sm">Compact document list</strong><span className="mt-1 block text-xs text-muted-foreground">Use a denser library layout when scanning many papers.</span></span><span className="toggle"><span /></span></div></div></section><div className="flex items-center justify-end gap-3"><span className={cn('text-xs text-primary transition-opacity', saved ? 'opacity-100' : 'opacity-0')}><Check size={13} className="mr-1 inline" />Preferences saved</span><button className="button button-primary" onClick={() => setSaved(true)} data-testid="button-save-settings">Save preferences</button></div></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/workspace/:id" component={WorkspacePage} /><Route path="/comparisons" component={ComparisonsPage} /><Route path="/evaluation" component={EvaluationPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;