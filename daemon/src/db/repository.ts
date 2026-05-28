// Repository interfaces for storage abstraction
// Both SQLite and Supabase implementations conform to these interfaces

// ---- Row Types (normalized, no storage-specific types leak through) ----

export interface TaskRow {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: number;
  status: "pending" | "in_progress" | "done" | "deleted";
  dueDate: string | null;
  tags: string[] | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleRow {
  id: string;
  userId: string;
  url: string | null;
  title: string;
  description: string | null;
  status: "unread" | "reading" | "finished";
  rating: number | null;
  notes: string | null;
  category: string | null;
  addedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ReviewRow {
  id: string;
  userId: string;
  type: "daily" | "weekly";
  periodStart: string;
  periodEnd: string;
  taskCompletionRate: number | null;
  articlesRead: number | null;
  summary: string | null;
  patterns: string[] | null;
  suggestions: string[] | null;
  rawData: unknown | null;
  createdAt: string;
}

export interface ConversationRow {
  id: string;
  userId: string;
  title: string;
  modelUsed: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls: string | null;
  toolCallId: string | null;
  tokenCount: number | null;
  createdAt: string;
}

// ---- Input Types ----

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: number;
  dueDate?: string;
  tags?: string[];
}

export interface TaskFilters {
  status?: string;
  priority?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface UpdateTaskData {
  title?: string;
  priority?: number;
  status?: string;
  dueDate?: string;
  tags?: string[];
  completedAt?: string;
}

export interface CreateArticleInput {
  title: string;
  url?: string;
  description?: string;
  category?: string;
}

export interface ArticleFilters {
  status?: string;
  category?: string;
  limit?: number;
}

export interface UpdateArticleData {
  status?: string;
  rating?: number;
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface SaveReviewInput {
  type: "daily" | "weekly";
  summary: string;
  patterns: string[];
  suggestions?: string[];
}

export interface DailySummaryResult {
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  articlesRead: number;
  highlights: string[];
}

export interface WeeklyStatsResult {
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  dailyBreakdown: { date: string; completed: number; total: number }[];
  articlesFinished: number;
  topTags: { tag: string; count: number }[];
}

export interface MessageInput {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: string;
  toolCallId?: string;
  tokenCount?: number;
}

// ---- Repository Interfaces ----

export interface TaskRepository {
  create(input: CreateTaskInput): Promise<TaskRow>;
  query(filters?: TaskFilters): Promise<TaskRow[]>;
  getById(id: string): Promise<TaskRow | null>;
  update(id: string, data: UpdateTaskData): Promise<TaskRow>;
  delete(id: string): Promise<boolean>;
  getTodayTasks(): Promise<TaskRow[]>;
}

export interface ArticleRepository {
  create(input: CreateArticleInput): Promise<ArticleRow>;
  list(filters?: ArticleFilters): Promise<ArticleRow[]>;
  getById(id: string): Promise<ArticleRow | null>;
  update(id: string, data: UpdateArticleData): Promise<ArticleRow>;
}

export interface ReviewRepository {
  save(input: SaveReviewInput): Promise<ReviewRow>;
  getHistory(type: "daily" | "weekly", limit?: number): Promise<ReviewRow[]>;
  getDailySummary(date?: string): Promise<DailySummaryResult>;
  getWeeklyStats(weekStart?: string): Promise<WeeklyStatsResult>;
}

export interface ConversationRepository {
  create(title?: string): Promise<ConversationRow>;
  list(): Promise<ConversationRow[]>;
  getById(id: string): Promise<ConversationRow | null>;
  update(id: string, data: { title?: string }): Promise<ConversationRow>;
  delete(id: string): Promise<boolean>;
  addMessage(conversationId: string, data: MessageInput): Promise<MessageRow>;
  getMessages(conversationId: string): Promise<MessageRow[]>;
}

// ---- Aggregate ----

export interface Repositories {
  tasks: TaskRepository;
  articles: ArticleRepository;
  reviews: ReviewRepository;
  conversations: ConversationRepository;
}
