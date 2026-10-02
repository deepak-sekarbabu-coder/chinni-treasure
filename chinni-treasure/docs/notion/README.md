# Chinni Treasure — Notion documentation

The Notion side of this documentation set is a **wiki database**, not a plain page tree. This file records the structure and IDs so future edits can target the right objects.

## Notion structure

**Wiki database:** [Chinni Treasure Wiki](https://app.notion.com/p/0c2c1c04b7c340fbabd91d0c74e8666f)

- Database id: `0c2c1c04-b7c3-40fb-abd9-1d0c74e8666f`
- Data source id: `52de1a86-479c-4ed8-91cd-69ed81e03d2e`
- Lives under the **Welcome to Notion!** page.

### Schema

| Property | Type | Purpose |
| --- | --- | --- |
| `Name` | Title | Page title |
| `Category` | Select | `Overview`, `Engineering`, `Business`, `Decision record` |
| `Audience` | Multi-select | `Engineering`, `Business / Ops` — the primary filter |
| `Summary` | Rich text | One line, used in listings and search results |
| `Status` | Select | `Current`, `Needs review`, `Draft` |
| `Source` | URL | Canonical file in the GitHub repo |

### Entries

| Page | Id | Category |
| --- | --- | --- |
| [Chinni Treasure — Documentation](https://app.notion.com/p/3ed390bdc530810e8b92e6ff18c9c462) | `3ed390bd-c530-810e-8b92-e6ff18c9c462` | Overview |
| [Technical Overview](https://app.notion.com/p/3ed390bdc530812fbaf1dd3d990dd504) | `3ed390bd-c530-812f-baf1-dd3d990dd504` | Engineering |
| [Project Overview (Non-Technical)](https://app.notion.com/p/3ed390bdc530818a95c3cb2ace1fec3f) | `3ed390bd-c530-818a-95c3-cb2ace1fec3f` | Business |
| [ADR-0001 — Cache ownership](https://app.notion.com/p/3ed390bdc5308199b29decfae27ac2cc) | `3ed390bd-c530-8199-b29d-ecfae27ac2cc` | Decision record |
| [ADR-0002 — Pricing basis](https://app.notion.com/p/3ed390bdc53081b095c0e82fc7af4d43) | `3ed390bd-c530-81b0-95c0-e82fc7af4d43` | Decision record |
| [ADR-0003 — Line projections](https://app.notion.com/p/3ed390bdc53081918bc7e6504be85732) | `3ed390bd-c530-8191-8bc7-e6504be85732` | Decision record |

The three overview pages in this directory are the Markdown source for the first three wiki entries. The ADR entries were written directly in Notion from `docs/adr/`.

## Markdown sources

<table><tr><td>

- [`chinni-treasure.md`](chinni-treasure.md) — wiki entry "Chinni Treasure — Documentation"
- [`chinni-treasure-technical-overview.md`](chinni-treasure-technical-overview.md) — wiki entry "Technical Overview"
- [`chinni-treasure-overview-non-technical.md`](chinni-treasure-overview-non-technical.md) — wiki entry "Project Overview (Non-Technical)"

</td></tr></table>

## Notion authoring constraints

Discovered while publishing; these will bite again.

1. **Table cells reject HTML.** Use `**bold**` and `*italic*`, never `<strong>` / `<em>`. Attempting HTML inside a `<td>` fails the whole save with a validation error.
2. **Bare filenames with an extension get auto-linked.** `` `AGENTS.md` `` in prose is safe; a bare `AGENTS.md` becomes a link to `http://AGENTS.md`. Always use an explicit Markdown link for anything that should point somewhere real.
3. **Nested bold collapses badly.** `**\`code\`**` produces doubled markers (`****`). Keep bold and code spans in separate runs.
4. **`update_content` needs exact indentation.** Multi-line blocks such as `<callout>` have their contents indented with tabs; an `old_str` without those tabs will not match.
5. **Mermaid renders natively.** ` ```mermaid ` code blocks become diagrams — verified working for `flowchart`, `erDiagram`, `sequenceDiagram`, and `stateDiagram-v2`.
6. **The wiki flag is not API-settable.** A `<database wiki="true">` block is stored as literal text rather than creating a wiki database. This database is a structured wiki in the practical sense, not a Notion-native wiki object.
7. **Folders cannot be move destinations.** `move_pages` rejects a folder id with `object_not_found`; only pages, databases, and data sources are valid targets.
8. **Data source ids must be bare UUIDs.** The `collection://…` URI form is rejected by `move_pages` and `create_pages` even though `fetch` accepts it.

## Maintaining these pages

Prefer editing Notion in place for prose changes, and keep the Markdown sources in sync for the three overview pages. Use `notion-update-page` with `command: "update_content"` for targeted edits — full `replace_content` must preserve the child `<page url="…">` tags or it will delete subpages.