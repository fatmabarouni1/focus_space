import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  FileUp,
  Globe,
  Layers3,
  Link2,
  NotebookPen,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import {
  createLink,
  deleteDocument,
  deleteLink,
  fetchModuleAiOutputs,
  fetchDocuments,
  fetchLinks,
  fetchModule,
  fetchNote,
  generateModuleKeywords,
  generateModuleQuiz,
  generateModuleSummary,
  saveNote,
  saveModuleAiOutput,
  searchModuleResources,
  uploadDocument,
  type ModuleDocument,
  type ModuleLink,
  type ModuleNote,
  type ResourceSearchResult,
  type RevisionModule,
  type StudyCoachQuiz,
  type StudyCoachResponse,
  type StudyCoachKeywords,
  type StudyCoachSummary,
} from '@/app/api/revision';
import { BaseCard } from '@/app/components/base-card';
import { Pill } from '@/app/components/pill';
import { PrimaryButton, SecondaryButton } from '@/app/components/button-kit';

interface ModulePageProps {
  authToken: string;
  moduleId: string;
  onBack: () => void;
}

type StudioTab = 'summary' | 'keywords' | 'quiz' | 'resources';

const panelClassName =
  'rounded-[28px] border border-border/60 bg-background/88 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl';

const studioTabs: { id: StudioTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'resources', label: 'Resources' },
];

const getFileTypeLabel = (mimeType?: string) => {
  if (!mimeType) return 'File';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.startsWith('text/')) return 'Text';
  return mimeType.split('/')[1]?.toUpperCase() ?? 'File';
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`;
};

export function ModulePage({ authToken, moduleId, onBack }: ModulePageProps) {
  const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  const [module, setModule] = useState<RevisionModule | null>(null);
  const [documents, setDocuments] = useState<ModuleDocument[]>([]);
  const [note, setNote] = useState<ModuleNote | null>(null);
  const [links, setLinks] = useState<ModuleLink[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [summaryResult, setSummaryResult] = useState<StudyCoachResponse<StudyCoachSummary> | null>(null);
  const [quizResult, setQuizResult] = useState<StudyCoachResponse<StudyCoachQuiz> | null>(null);
  const [keywordsResult, setKeywordsResult] = useState<StudyCoachResponse<StudyCoachKeywords> | null>(null);
  const [resourceQuery, setResourceQuery] = useState('');
  const [resourceResults, setResourceResults] = useState<ResourceSearchResult[]>([]);
  const [searchedResourceQuery, setSearchedResourceQuery] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [quizError, setQuizError] = useState('');
  const [resourcesError, setResourcesError] = useState('');
  const [keywordsError, setKeywordsError] = useState('');
  const [activeTab, setActiveTab] = useState<StudioTab>('summary');
  const [revealedQuizAnswers, setRevealedQuizAnswers] = useState<Record<number, boolean>>({});
  const [savingCurrentResult, setSavingCurrentResult] = useState(false);

  useEffect(() => {
    loadModule();
  }, [authToken, moduleId]);

  const loadModule = async () => {
    if (!authToken || !moduleId) return;
    setLoading(true);
    setError('');
    try {
      const [aiOutputs, loadedModule, loadedDocs, loadedNote, loadedLinks] = await Promise.all([
        fetchModuleAiOutputs(authToken, moduleId),
        fetchModule(authToken, moduleId),
        fetchDocuments(authToken, moduleId),
        fetchNote(authToken, moduleId),
        fetchLinks(authToken, moduleId),
      ]);
      setModule(loadedModule);
      setDocuments(loadedDocs);
      setNote(loadedNote);
      setNoteContent(loadedNote?.content ?? '');
      setLinks(loadedLinks);
      setSummaryResult(aiOutputs.summary ?? null);
      setQuizResult(aiOutputs.quiz ?? null);
      setKeywordsResult(aiOutputs.keywords ?? null);
      setResourceQuery(loadedModule.title ?? '');
      setSummaryError('');
      setQuizError('');
      setResourcesError('');
      setKeywordsError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load module.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!authToken || !event.target.files?.[0]) return;
    setError('');
    try {
      const uploaded = await uploadDocument(authToken, moduleId, event.target.files[0]);
      setDocuments((prev) => [uploaded, ...prev]);
      event.target.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!authToken) return;
    setError('');
    try {
      await deleteDocument(authToken, documentId);
      setDocuments((prev) => prev.filter((doc) => doc._id !== documentId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document.');
    }
  };

  const handleSaveNote = async () => {
    if (!authToken) return;
    setSavingNote(true);
    setError('');
    try {
      const saved = await saveNote(authToken, moduleId, noteContent);
      setNote(saved);
    } catch (err: any) {
      setError(err.message || 'Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authToken) return;
    setError('');
    try {
      const created = await createLink(authToken, moduleId, { title: linkTitle, url: linkUrl });
      setLinks((prev) => [created, ...prev]);
      setLinkTitle('');
      setLinkUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to add link.');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!authToken) return;
    setError('');
    try {
      await deleteLink(authToken, linkId);
      setLinks((prev) => prev.filter((link) => link._id !== linkId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete link.');
    }
  };

  const handleGenerateSummary = async () => {
    if (!authToken) return;
    setActiveTab('summary');
    setSummaryLoading(true);
    setSummaryError('');
    try {
      setSummaryResult(await generateModuleSummary(authToken, moduleId));
    } catch (err: any) {
      setSummaryError(err.message || 'Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!authToken) return;
    setActiveTab('quiz');
    setQuizLoading(true);
    setQuizError('');
    try {
      if (!summaryResult) {
        const generatedSummary = await generateModuleSummary(authToken, moduleId);
        setSummaryResult(generatedSummary);
      }
      setQuizResult(await generateModuleQuiz(authToken, moduleId));
      setRevealedQuizAnswers({});
    } catch (err: any) {
      setQuizError(err.message || 'Failed to generate quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSearchResources = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!authToken) return;
    await performResourceSearch(resourceQuery);
  };

  const handleGenerateKeywords = async () => {
    if (!authToken) return;
    setActiveTab('keywords');
    setKeywordsLoading(true);
    setKeywordsError('');
    try {
      setKeywordsResult(await generateModuleKeywords(authToken, moduleId));
    } catch (err: any) {
      setKeywordsError(err.message || 'Failed to generate keywords.');
    } finally {
      setKeywordsLoading(false);
    }
  };

  const handleOpenResources = async () => {
    if (!authToken) return;
    let currentSummary = summaryResult;
    if (!currentSummary) {
      setSummaryLoading(true);
      setSummaryError('');
      try {
        currentSummary = await generateModuleSummary(authToken, moduleId);
        setSummaryResult(currentSummary);
      } catch (err: any) {
        setSummaryError(err.message || 'Failed to generate summary.');
      } finally {
        setSummaryLoading(false);
      }
    }

    const inferredTopic =
      currentSummary?.output.title?.trim() ||
      currentSummary?.output.mainIdeas?.find(Boolean) ||
      currentSummary?.output.keyPoints?.find(Boolean) ||
      '';
    const currentQuery = resourceQuery.trim();
    const titleQuery = module?.title?.trim() ?? '';
    const queryToUse =
      !currentQuery || currentQuery === titleQuery
        ? inferredTopic || suggestedResourceQuery
        : currentQuery;
    await performResourceSearch(queryToUse);
  };

  const handleSaveCurrentResult = async () => {
    if (!authToken) return;
    setSavingCurrentResult(true);
    setError('');
    try {
      if (activeTab === 'summary') {
        if (!summaryResult) throw new Error('No summary to save.');
        const saved = await saveModuleAiOutput(authToken, moduleId, 'summary', summaryResult.output);
        setSummaryResult(saved);
      } else if (activeTab === 'quiz') {
        if (!quizResult) throw new Error('No quiz to save.');
        const saved = await saveModuleAiOutput(authToken, moduleId, 'quiz', quizResult.output);
        setQuizResult(saved);
      } else if (activeTab === 'keywords') {
        if (!keywordsResult) throw new Error('No keywords to save.');
        const saved = await saveModuleAiOutput(authToken, moduleId, 'keywords', keywordsResult.output);
        setKeywordsResult(saved);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save current result.');
    } finally {
      setSavingCurrentResult(false);
    }
  };

  const getFileUrl = (url: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return apiBaseUrl ? `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}` : url;
  };

  const moduleMeta = useMemo(() => {
    const noteWords = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
    return [
      `${documents.length} source${documents.length === 1 ? '' : 's'}`,
      `${links.length} link${links.length === 1 ? '' : 's'}`,
      `${noteWords} note words`,
    ];
  }, [documents.length, links.length, noteContent]);

  const suggestedResourceQuery = useMemo(() => {
    const summaryTitle = summaryResult?.output.title?.trim() ?? '';
    if (summaryTitle) {
      return summaryTitle;
    }

    const mainIdeas = summaryResult?.output.mainIdeas?.filter(Boolean) ?? [];
    if (mainIdeas.length) {
      return mainIdeas[0];
    }

    const keyPoints = summaryResult?.output.keyPoints?.filter(Boolean) ?? [];
    if (keyPoints.length) {
      return keyPoints[0];
    }

    const keywords = keywordsResult?.output.keywords?.filter(Boolean).slice(0, 4) ?? [];
    if (keywords.length) {
      return keywords.join(' ');
    }

    const keyConcepts = summaryResult?.output.keyConcepts?.filter(Boolean) ?? [];
    if (keyConcepts.length) {
      return keyConcepts.slice(0, 3).join(' ');
    }

    return module?.title?.trim() ?? '';
  }, [keywordsResult, module?.title, summaryResult]);

  const performResourceSearch = async (query: string) => {
    if (!authToken) return;
    const trimmedQuery = query.trim();
    setActiveTab('resources');
    if (!trimmedQuery) {
      setResourcesError('Generate keywords or summary first, or enter a query to search for resources.');
      return;
    }

    setResourcesLoading(true);
    setResourcesError('');
    try {
      const data = await searchModuleResources(authToken, moduleId, trimmedQuery);
      setResourceQuery(trimmedQuery);
      setResourceResults(data.results);
      setSearchedResourceQuery(data.query);
    } catch (err: any) {
      setResourcesError(err.message || 'Failed to search resources.');
    } finally {
      setResourcesLoading(false);
    }
  };

  const renderStudioContent = () => {
    if (activeTab === 'summary') {
      if (summaryLoading) return <div className="h-56 animate-pulse rounded-[28px] bg-muted/60" />;
      if (summaryError) return <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{summaryError}</div>;
      if (!summaryResult) return <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">Generate a polished overview from your sources and notes.</div>;
      const keyIdeas = [
        ...(summaryResult.output.mainIdeas ?? []),
        ...(summaryResult.output.keyPoints ?? []),
      ].map((item) => item?.trim()).filter(Boolean);
      const uniqueKeyIdeas = [...new Set(keyIdeas)].slice(0, 8);
      return (
        <div className="space-y-4">
          <div className="rounded-[30px] border border-border/70 bg-gradient-to-br from-background to-muted/30 p-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <Pill className="bg-muted text-muted-foreground">{summaryResult.cached ? 'Generated today' : 'Fresh insight'}</Pill>
              {summaryResult.meta?.notesIncluded ? <Pill className="bg-[var(--focus-light)] text-[var(--focus-primary)]">Notes included</Pill> : null}
            </div>
            <p className="whitespace-pre-line text-[15px] leading-7 text-foreground/85">{summaryResult.output.summary}</p>
          </div>
          {uniqueKeyIdeas.length ? (
            <div className="rounded-[28px] border border-border/70 bg-background p-5">
              <h3 className="mb-3 text-base font-semibold">Key Ideas</h3>
              <div className="grid gap-3">
                {uniqueKeyIdeas.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-sm leading-6">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {summaryResult.output.detailedSummary ? (
            <div className="rounded-[28px] border border-border/70 bg-background p-5">
              <h3 className="mb-3 text-base font-semibold">Detailed Summary</h3>
              <p className="whitespace-pre-line text-sm leading-7 text-foreground/85">{summaryResult.output.detailedSummary}</p>
            </div>
          ) : null}
          {summaryResult.output.importantNotes?.length ? (
            <div className="rounded-[28px] border border-border/70 bg-background p-5">
              <h3 className="mb-3 text-base font-semibold">Important Notes</h3>
              <div className="grid gap-3">
                {summaryResult.output.importantNotes.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-sm leading-6">{item}</div>
                ))}
              </div>
            </div>
          ) : null}
          {summaryResult.meta ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 text-sm">Notes: {summaryResult.meta.notesIncluded ? 'Yes' : 'No'}</div>
              <div className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 text-sm">PDF text: {summaryResult.meta.pdfTextIncluded ? 'Included' : 'Missing'}</div>
              <div className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 text-sm">Chars used: {summaryResult.meta.extractedChars ?? 0}</div>
            </div>
          ) : null}
        </div>
      );
    }

    if (activeTab === 'quiz') {
      if (quizLoading) return <div className="h-72 animate-pulse rounded-[28px] bg-muted/60" />;
      if (quizError) return <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{quizError}</div>;
      if (!quizResult) return <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">Generate an interactive quiz from your study material.</div>;
      return (
        <div className="grid gap-4">
          {quizResult.output.questions.map((question, index) => {
            const isRevealed = revealedQuizAnswers[index];
            return (
              <div key={`quiz-${index}`} className="rounded-[28px] border border-border/70 bg-background p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Pill className="bg-muted text-muted-foreground">{question.type === 'mcq' ? 'Multiple choice' : 'Short answer'}</Pill>
                    <Pill className="bg-[var(--focus-light)] text-[var(--focus-primary)]">Question {index + 1}</Pill>
                  </div>
                  <SecondaryButton size="sm" onClick={() => setRevealedQuizAnswers((prev) => ({ ...prev, [index]: !prev[index] }))}>
                    {isRevealed ? 'Hide answer' : 'Reveal answer'}
                  </SecondaryButton>
                </div>
                <div className="text-base font-medium leading-7">{question.question}</div>
                {question.type === 'mcq' && question.choices ? (
                  <div className="mt-4 grid gap-2">
                    {question.choices.map((choice, choiceIndex) => (
                      <div
                        key={`${choice}-${choiceIndex}`}
                        className={`rounded-2xl border px-4 py-3 text-sm ${isRevealed && question.answerIndex === choiceIndex ? 'border-[var(--focus-primary)] bg-[var(--focus-light)] text-[var(--focus-primary)]' : 'border-border/70 bg-muted/20 text-foreground/80'}`}
                      >
                        <span className="mr-2 text-muted-foreground">{String.fromCharCode(65 + choiceIndex)}.</span>
                        {choice}
                      </div>
                    ))}
                  </div>
                ) : null}
                {isRevealed ? (
                  <div className="mt-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 text-sm">
                    <div className="font-medium">{question.type === 'mcq' && question.answerIndex !== undefined ? String.fromCharCode(65 + question.answerIndex) : question.answer}</div>
                    {question.explanation ? <div className="mt-2 leading-6 text-muted-foreground">{question.explanation}</div> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === 'keywords') {
      if (keywordsLoading) return <div className="h-56 animate-pulse rounded-[28px] bg-muted/60" />;
      if (keywordsError) return <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{keywordsError}</div>;
      if (!keywordsResult) return <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">Generate concise keywords from your notes and documents.</div>;
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {keywordsResult.output.keywords.length > 0 ? keywordsResult.output.keywords.map((keyword, index) => (
              <Pill key={`${keyword}-${index}`} className="bg-[var(--focus-light)] px-4 py-2 text-[var(--focus-primary)]">{keyword}</Pill>
            )) : <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">No keywords were extracted.</div>}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="rounded-[28px] border border-border/70 bg-background p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Automatic resource search</div>
              <div className="mt-2 text-xs text-muted-foreground">
                Results are generated automatically from your keywords, summary ideas, or module title.
              </div>
            </div>
            <SecondaryButton type="button" disabled>
              Analyze with AI
            </SecondaryButton>
          </div>
          {searchedResourceQuery || suggestedResourceQuery ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill className="bg-muted text-muted-foreground">
                Query: {searchedResourceQuery || suggestedResourceQuery}
              </Pill>
            </div>
          ) : null}
        </div>

        {resourcesLoading ? <div className="h-72 animate-pulse rounded-[28px] bg-muted/60" /> : null}
        {resourcesError ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{resourcesError}</div> : null}
        {!resourcesLoading && !resourcesError && resourceResults.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
            {searchedResourceQuery ? 'No results returned for this query.' : 'Open the Resources tab after generating summary or keywords to load resource results automatically.'}
          </div>
        ) : null}

        {resourceResults.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Showing {resourceResults.length} result{resourceResults.length === 1 ? '' : 's'} for "{searchedResourceQuery}".
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {resourceResults.map((result) => (
                <div key={`${result.position}-${result.link}`} className="rounded-[28px] border border-border/70 bg-background p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{result.title}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Pill className="bg-muted text-muted-foreground">Result {result.position}</Pill>
                        <Pill className="bg-muted text-muted-foreground">{new URL(result.link).hostname.replace(/^www\./, '')}</Pill>
                      </div>
                    </div>
                    <SecondaryButton variant="ghost" size="sm" onClick={() => window.open(result.link, '_blank', 'noreferrer')}>Open</SecondaryButton>
                  </div>
                  <div className="text-sm leading-6 text-muted-foreground">{result.snippet || 'No snippet available.'}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.86))] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,124,153,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(169,143,180,0.10),transparent_35%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 w-fit rounded-full px-3"><ArrowLeft className="mr-2 h-4 w-4" />Modules</Button>
            {loading ? <div className="text-sm text-muted-foreground">Loading module...</div> : module ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill className="bg-[var(--focus-light)] text-[var(--focus-primary)]">AI Study Workspace</Pill>
                  <Pill className="bg-muted text-muted-foreground">Notebook mode</Pill>
                </div>
                <div>
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{module.title}</h1>
                  {module.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">{module.description}</p> : null}
                </div>
              </>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {moduleMeta.map((item) => <div key={item} className="rounded-3xl border border-border/70 bg-background/80 px-4 py-4 text-sm shadow-sm">{item}</div>)}
          </div>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)] xl:overflow-hidden">
          <BaseCard className={`${panelClassName} overflow-hidden p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Layers3 className="h-4 w-4" />Sources</div>
                <h2 className="mt-2 text-xl font-semibold">Source library</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">PDFs, notes, and links stay anchored here while the AI studio works in the center.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <FileUp className="h-4 w-4" />Upload
                <input type="file" className="hidden" onChange={handleDocumentUpload} />
              </label>
            </div>
            <div className="mt-5 space-y-3">
              {documents.length === 0 ? <div className="rounded-3xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No documents yet. Upload PDFs or handouts to enrich the workspace.</div> : documents.map((doc) => (
                <div key={doc._id} className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{doc.originalName ?? doc.original_name}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Pill className="bg-background text-muted-foreground">{getFileTypeLabel(doc.mime_type)}</Pill>
                        <Pill className="bg-background text-muted-foreground">{formatFileSize(doc.size)}</Pill>
                      </div>
                    </div>
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SecondaryButton asChild size="sm"><a href={getFileUrl(doc.url)} target="_blank" rel="noreferrer">Open</a></SecondaryButton>
                    <SecondaryButton variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc._id)}><Trash2 className="h-4 w-4" /></SecondaryButton>
                  </div>
                </div>
              ))}
            </div>
          </BaseCard>

          <BaseCard className={`${panelClassName} p-5 xl:max-h-[32vh] xl:overflow-y-auto`}>
            <div className="mb-4 flex items-center gap-2"><Globe className="h-4 w-4 text-[var(--focus-primary)]" /><h3 className="text-base font-semibold">Reference links</h3></div>
            <form onSubmit={handleAddLink} className="space-y-3">
              <Input placeholder="Link title" value={linkTitle} onChange={(event) => setLinkTitle(event.target.value)} required />
              <Input placeholder="https://" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} required />
              <PrimaryButton type="submit" className="w-full">Add link</PrimaryButton>
            </form>
            <div className="mt-4 space-y-2">
              {links.length === 0 ? <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">No links yet.</div> : links.map((link) => (
                <div key={link._id} className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{link.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{link.url}</div>
                    </div>
                    <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <SecondaryButton variant="ghost" size="sm" onClick={() => window.open(link.url, '_blank', 'noreferrer')}>Open</SecondaryButton>
                    <SecondaryButton variant="ghost" size="icon" onClick={() => handleDeleteLink(link._id)}><Trash2 className="h-4 w-4" /></SecondaryButton>
                  </div>
                </div>
              ))}
            </div>
          </BaseCard>
        </aside>

        <section className="space-y-5">
          <BaseCard className={`${panelClassName} p-5 sm:p-6`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><NotebookPen className="h-4 w-4 text-[var(--focus-primary)]" /><h3 className="text-lg font-semibold">Working notes</h3></div>
              <SecondaryButton size="sm" onClick={handleSaveNote} disabled={savingNote}><Save className="mr-2 h-4 w-4" />{savingNote ? 'Saving...' : 'Save note'}</SecondaryButton>
            </div>
            <Textarea rows={10} placeholder="Capture your own synthesis, examples, and memory hooks here..." value={noteContent} onChange={(event) => setNoteContent(event.target.value)} className="min-h-[220px] rounded-[28px] border-border/70 bg-muted/15" />
            {note?.updated_at ? <div className="mt-3 text-xs text-muted-foreground">Last saved {new Date(note.updated_at).toLocaleString()}</div> : null}
          </BaseCard>

          <BaseCard className={`${panelClassName} overflow-hidden p-6`}>
            <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Wand2 className="h-4 w-4" />AI Studio</div>
                <h2 className="mt-2 text-2xl font-semibold">Ask your material anything</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Your current sources and notes are used as context. Launch an action below to turn them into polished study outputs.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm transition-colors hover:border-[var(--focus-primary)] hover:text-[var(--focus-primary)]" onClick={handleGenerateSummary} disabled={summaryLoading}>{summaryLoading ? 'Regenerating Summary...' : 'Regenerate Summary'}</button>
                  <button type="button" className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm transition-colors hover:border-[var(--focus-primary)] hover:text-[var(--focus-primary)]" onClick={handleGenerateKeywords} disabled={keywordsLoading}>{keywordsLoading ? 'Finding Keywords...' : 'Generate Keywords'}</button>
                  <button type="button" className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm transition-colors hover:border-[var(--focus-primary)] hover:text-[var(--focus-primary)]" onClick={handleGenerateQuiz} disabled={quizLoading}>{quizLoading ? 'Regenerating Quiz...' : 'Regenerate Quiz'}</button>
                  <button type="button" className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm transition-colors hover:border-[var(--focus-primary)] hover:text-[var(--focus-primary)]" onClick={handleOpenResources} disabled={resourcesLoading}>{resourcesLoading ? 'Regenerating Resources...' : 'Regenerate Resources'}</button>
                </div>
              </div>
              <div className="rounded-[24px] border border-border/60 bg-background/72 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />Workspace pulse</div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Inputs</span>
                    <span className="font-medium">{documents.length + links.length > 0 ? 'Connected' : 'Waiting'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="font-medium">{noteContent.trim() ? 'Ready' : 'Empty'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Last action</span>
                    <span className="font-medium">{resourceResults.length > 0 ? 'Resources' : quizResult ? 'Quiz' : keywordsResult ? 'Keywords' : summaryResult ? 'Summary' : 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard className={`${panelClassName} p-4 sm:p-5`}>
            <div className="flex flex-wrap gap-2">
                {studioTabs.map((tab) => (
                  <button key={tab.id} type="button" onClick={() => (tab.id === 'resources' ? handleOpenResources() : setActiveTab(tab.id))} className={`rounded-full px-4 py-2 text-sm transition-all ${activeTab === tab.id ? 'bg-[var(--focus-primary)] text-white shadow-sm' : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{tab.label}</button>
                ))}
            </div>
          </BaseCard>

          <BaseCard className={`${panelClassName} p-5 sm:p-6`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Main workspace</div>
                <h3 className="mt-1 text-xl font-semibold">{activeTab === 'summary' ? 'Summary' : activeTab === 'keywords' ? 'Keywords' : activeTab === 'quiz' ? 'Interactive quiz' : 'Curated resources'}</h3>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'summary' && summaryResult?.cached ? <Pill className="bg-muted text-muted-foreground">Loaded from saved content</Pill> : null}
                {activeTab === 'quiz' && quizResult?.cached ? <Pill className="bg-muted text-muted-foreground">Generated today</Pill> : null}
                {activeTab === 'resources' ? (
                  <SecondaryButton size="sm" onClick={handleOpenResources} disabled={resourcesLoading}>
                    {resourcesLoading ? 'Regenerating...' : 'Regenerate Resources'}
                  </SecondaryButton>
                ) : null}
                {(activeTab === 'summary' && summaryResult) ||
                (activeTab === 'quiz' && quizResult) ||
                (activeTab === 'keywords' && keywordsResult) ? (
                  <SecondaryButton size="sm" onClick={handleSaveCurrentResult} disabled={savingCurrentResult}>
                    {savingCurrentResult ? 'Saving...' : 'Save'}
                  </SecondaryButton>
                ) : null}
              </div>
            </div>
            {renderStudioContent()}
          </BaseCard>
        </section>

      </div>
    </div>
  );
}
