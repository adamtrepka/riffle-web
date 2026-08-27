// Generated file — do not edit. Regenerate with pnpm schema:generate.

export interface IssueExportResponse {
  id?: string;
  title?: string;
  teaser?: null | string;
  generatedAt?: string;
  items?: IssueExportItem[];
}
export interface IssueExportItem {
  position?: number;
  redditPostId?: string;
  title?: string;
  description?: string;
  redditUrl?: null | string;
  resourceUrl?: null | string;
  subreddit?: null | string;
}
