import type { Repositories } from "../repository.js";
import { createSqliteTaskRepo } from "./task-repo.js";
import { createSqliteArticleRepo } from "./article-repo.js";
import { createSqliteReviewRepo } from "./review-repo.js";
import { createSqliteConversationRepo } from "./conversation-repo.js";

export function createSqliteRepositories(): Repositories {
  return {
    tasks: createSqliteTaskRepo(),
    articles: createSqliteArticleRepo(),
    reviews: createSqliteReviewRepo(),
    conversations: createSqliteConversationRepo(),
  };
}
