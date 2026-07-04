import { Hono } from 'hono'
import { tools } from '../docs'

export const helpRoutes = new Hono()

const PAGE_STYLE = `
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #222; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; vertical-align: top; }
  th { background: #f7f7f7; }
  code { background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 3px; }
  pre { background: #f4f4f4; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  nav p { margin: 0.3rem 0; }
`

function renderPage(title: string, bodyHtml: string, status: 200 | 404 = 200): Response {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>${PAGE_STYLE}</style></head>
<body><h1>${title}</h1>${bodyHtml}</body></html>`
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// GET /help — all tools
helpRoutes.get('/help', (c) => {
  const nav = `<nav>${tools
    .map((t) => `<p><a href="/help/${t.meta.name}">${t.meta.name}</a> — ${t.meta.summary}</p>`)
    .join('')}</nav>`
  const sections = tools.map((t) => t.docsHtml).join('')
  return renderPage('Available Tools', nav + sections)
})

// GET /help/:tool — single tool
helpRoutes.get('/help/:tool', (c) => {
  const name = c.req.param('tool')
  const tool = tools.find((t) => t.meta.name === name)
  if (!tool) {
    return renderPage('Not Found', `<p>Unknown tool: ${name}</p>`, 404)
  }
  return renderPage(`${tool.meta.name} — Help`, tool.docsHtml)
})
