// Generated file — do not edit. Regenerate with pnpm schema:generate.
import type { IssueExportResponse } from './issue-export'

export interface IssueExportValidationError {
  instancePath: string
  schemaPath: string
  keyword: string
  params: Record<string, unknown>
  message?: string
}

export interface IssueExportValidator {
  (data: unknown): data is IssueExportResponse
  errors?: IssueExportValidationError[] | null
}

declare const validateIssueExport: IssueExportValidator
export = validateIssueExport
