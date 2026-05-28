import type { Repositories } from "../repository.js";
import { createSupabaseTaskRepo } from "./task-repo.js";
import { createSupabaseArticleRepo } from "./article-repo.js";
import { createSupabaseReviewRepo } from "./review-repo.js";
import { createSupabaseConversationRepo } from "./conversation-repo.js";

export function createSupabaseRepositories(): Repositories {
  return {
    tasks: createSupabaseTaskRepo(),
    articles: createSupabaseArticleRepo(),
    reviews: createSupabaseReviewRepo(),
    conversations: createSupabaseConversationRepo(),
  };
}
