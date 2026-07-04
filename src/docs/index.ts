/**
 * Tool registry — single source of truth for the tool list.
 *
 * The root <code>GET /</code> endpoint and the <code>/help</code> routes both
 * read from here. Append new tools to add them everywhere automatically.
 */

import { qrToolMeta, qrDocsHtml } from './qr'

export interface ToolEntry {
  meta: { name: string; path: string; summary: string }
  docsHtml: string
}

export const tools: ToolEntry[] = [
  { meta: qrToolMeta, docsHtml: qrDocsHtml },
  // future tools appended here
]
