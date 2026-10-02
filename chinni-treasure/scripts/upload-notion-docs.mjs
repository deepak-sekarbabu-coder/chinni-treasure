#!/usr/bin/env node
/**
 * Uploads the Chinni Treasure Notion docs into a parent Notion page.
 *
 * Creates three pages: the parent index plus its two child pages
 * (technical overview, non-technical overview), mirroring the file layout
 * in docs/notion/.
 *
 * Usage:
 *   NOTION_TOKEN=secret_xxx node scripts/upload-notion-docs.mjs
 *
 * Optional:
 *   NOTION_PARENT_ID=<uuid> override the parent page (defaults to "Welcome to Notion!")
 *   NOTION_DRY_RUN=1        print the plan without calling the API
 *
 * The Notion integration must be shared with the parent page ("Full content"
 * for write access), otherwise the API returns 404 for a page you cannot see.
 */

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = join(HERE, '..', 'docs', 'notion')

// "Welcome to Notion!" — override with NOTION_PARENT_ID.
const DEFAULT_PARENT_ID = '235390bdc53080269eb0f73a15f27660'

const PAGES = [
  {
    file: 'chinni-treasure.md',
    title: 'Chinni Treasure — Documentation',
    icon: '💎',
    children: [
      { file: 'chinni-treasure-technical-overview.md', title: 'Technical Overview', icon: '🛠️' },
      { file: 'chinni-treasure-overview-non-technical.md', title: 'Project Overview (Non-Technical)', icon: '📖' },
    ],
  },
]

/** Split a markdown file into Notion blocks. */
function markdownToBlocks(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let index = 0

  const inline = (text) => {
    // Bold, italic, and inline code. Order matters: code first so its
    // contents are never re-parsed as emphasis.
    const rich = []
    const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g
    let last = 0
    let match
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > last) rich.push({ type: 'text', text: { content: text.slice(last, match.index) } })
      const token = match[0]
      if (token.startsWith('`')) {
        rich.push({ type: 'text', text: { content: token.slice(1, -1) }, annotations: { code: true } })
      } else if (token.startsWith('**')) {
        rich.push({ type: 'text', text: { content: token.slice(2, -2) }, annotations: { bold: true } })
      } else {
        rich.push({ type: 'text', text: { content: token.slice(1, -1) }, annotations: { italic: true } })
      }
      last = match.index + token.length
    }
    if (last < text.length) rich.push({ type: 'text', text: { content: text.slice(last) } })
    return rich.length ? rich : [{ type: 'text', text: { content: '' } }]
  }

  const paragraph = (text) => ({
    type: 'paragraph',
    paragraph: { rich_text: inline(text) },
  })

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    // Fenced code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const body = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        body.push(lines[index])
        index += 1
      }
      index += 1
      blocks.push({
        type: 'code',
        code: {
          language: language || 'plain text',
          rich_text: [{ type: 'text', text: { content: body.join('\n') } }],
        },
      })
      continue
    }

    // Heading
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length + 1 // shift past the page title (H1)
      blocks.push({
        type: `heading_${Math.min(level, 3)}`,
        [`heading_${Math.min(level, 3)}`]: { rich_text: inline(heading[2]) },
      })
      index += 1
      continue
    }

    // Bulleted list (single level; nested items are flattened)
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line)
    if (bullet) {
      blocks.push({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: inline(bullet[1]) } })
      index += 1
      continue
    }

    // Numbered list
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line)
    if (numbered) {
      blocks.push({ type: 'numbered_list_item', numbered_list_item: { rich_text: inline(numbered[1]) } })
      index += 1
      continue
    }

    // Table rows are not converted; flag them so the gap is visible.
    if (line.trim().startsWith('|')) {
      const body = []
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        body.push(lines[index].trim())
        index += 1
      }
      blocks.push(paragraph(body.join('  —  ').replace(/\|\s*---[\s|-]*/g, '')))
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', quote: { rich_text: inline(line.slice(2)) } })
      index += 1
      continue
    }

    // Divider
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push({ type: 'divider', divider: {} })
      index += 1
      continue
    }

    // Paragraph: consume the whole run until a blank line.
    const para = []
    while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|```|\s*[-*]\s|\s*\d+\.\s|>|\|)/.test(lines[index])) {
      para.push(lines[index].trim())
      index += 1
    }
    if (para.length) blocks.push(paragraph(para.join(' ')))
  }

  return blocks
}

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

async function notion(path, token, init = {}) {
  const response = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(`Notion API ${response.status} on ${path}: ${JSON.stringify(body)}`)
  }
  return body
}

async function createPage(parentId, title, icon, markdown, token, dryRun) {
  const blocks = markdownToBlocks(markdown)
  console.log(`  → "${title}" (${blocks.length} blocks)`)
  if (dryRun) return { id: 'dry-run' }

  // Notion accepts at most 100 children per request.
  const first = blocks.slice(0, 100)
  const page = await notion('/pages', token, {
    method: 'POST',
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: parentId },
      icon: icon ? { type: 'emoji', emoji: icon } : undefined,
      properties: { title: { type: 'title', title: [{ type: 'text', text: { content: title } }] } },
      children: first,
    }),
  })

  for (let offset = 100; offset < blocks.length; offset += 100) {
    await notion(`/blocks/${page.id}/children`, token, {
      method: 'PATCH',
      body: JSON.stringify({ children: blocks.slice(offset, offset + 100) }),
    })
  }
  return page
}

async function main() {
  const token = process.env.NOTION_TOKEN
  const parentId = process.env.NOTION_PARENT_ID ?? DEFAULT_PARENT_ID
  const dryRun = process.env.NOTION_DRY_RUN === '1'

  if (!token && !dryRun) {
    console.error('Missing NOTION_TOKEN. Set it, or run with NOTION_DRY_RUN=1 to preview.')
    process.exit(1)
  }

  for (const page of PAGES) {
    console.log(`Reading ${page.file}`)
    const markdown = await readFile(join(DOCS_DIR, page.file), 'utf8')
    const created = await createPage(parentId, page.title, page.icon, markdown, token, dryRun)

    for (const child of page.children) {
      console.log(`Reading ${child.file}`)
      const childMarkdown = await readFile(join(DOCS_DIR, child.file), 'utf8')
      await createPage(created.id, child.title, child.icon, childMarkdown, token, dryRun)
    }
  }

  console.log(dryRun ? 'Dry run complete.' : 'Done.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})