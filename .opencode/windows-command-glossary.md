# Windows 11 Command Glossary

Persistent operational reference for every PowerShell / CMD command executed in this repo.

**Shell used by this harness: PowerShell 5.1** (`shell` tool). When a command must use CMD-only
behavior, wrap it as `cmd /c "..."` instead of mixing syntax.

## Mandatory pre-execution checklist

1. Determine the shell (PowerShell or CMD).
2. Search this file for the closest match.
3. Reuse the documented syntax.
4. Validate Windows path syntax + quoting.
5. Execute, inspect output.
6. Append newly discovered / corrected commands below.

## Core commands

| Purpose | Shell | Correct Command | Notes |
|---|---|---|---|
| Current directory | PowerShell | `Get-Location` | Prefer over `pwd` |
| Current directory | CMD | `cd` | No args prints cwd |
| List files | PowerShell | `Get-ChildItem -LiteralPath "C:\Some Folder"` | `-LiteralPath` = no wildcard expansion |
| List files | PowerShell | `Get-ChildItem -Name` | Names only (do NOT use `dir /b`) |
| List files | CMD | `dir` | CMD syntax; `dir /b` fails in PowerShell with `Cannot find path 'C:\b'` |
| Recursive file list | PowerShell | `Get-ChildItem -LiteralPath "C:\src" -Recurse -File` | `-File` = files only |
| Read file | PowerShell | `Get-Content -LiteralPath "C:\a.txt"` | `type` is an alias; encoding matters for UTF-8 |
| Read file | CMD | `type "C:\a.txt"` | |
| Read file with encoding | PowerShell | `Get-Content -LiteralPath "C:\a.txt" -Encoding UTF8` | PS 5.1 defaults to ANSI |
| Write file | PowerShell | `Set-Content -LiteralPath "C:\a.txt" -Value "text" -Encoding UTF8` | Prefer `write` tool for repo files |
| Create file (empty) | PowerShell | `New-Item -ItemType File -Path "C:\a.txt"` | |
| Create directory | PowerShell | `New-Item -ItemType Directory -Path "C:\dir"` | `-Force` if it may exist |
| Create directory | CMD | `mkdir "C:\dir"` | |
| Copy file | PowerShell | `Copy-Item -LiteralPath "C:\a" -Destination "C:\b"` | |
| Move/rename | PowerShell | `Move-Item -LiteralPath "C:\a" -Destination "C:\b"` | |
| Delete file | PowerShell | `Remove-Item -LiteralPath "C:\a.txt" -Force` | `-Recurse` for directories |
| Delete file | CMD | `del /F /Q "C:\a.txt"` | |
| Search file contents | PowerShell | `Get-ChildItem -Path "C:\src" -Recurse -File \| Select-String -Pattern "foo"` | `findstr` is the CMD equivalent |
| Search filenames | PowerShell | `Get-ChildItem -LiteralPath "C:\src" -Recurse -Filter "*foo*"` | |
| Find executable | PowerShell | `Get-Command git` | `where.exe git` for CMD/PATH probing |
| Environment variable | PowerShell | `$env:PATH` | `$env:FOO = "bar"` to set |
| Admin required? | PowerShell | `([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)` | |
| Elevated command | PowerShell | `Start-Process -Verb RunAs -FilePath "cmd.exe" -ArgumentList "/c ..."` | Never use `sudo` |

## Git (invoked through PowerShell, git itself is portable)

| Purpose | Correct Command | Notes |
|---|---|---|
| Status | `git -C "C:\Projects\website" status` | Use `-C` instead of `cd` + chaining |
| Root dir | `git -C "C:\Projects\website" rev-parse --show-toplevel` | |
| Current branch | `git -C "C:\Projects\website" rev-parse --abbrev-ref HEAD` | |
| Recent log | `git -C "C:\Projects\website" log --oneline -20` | |
| Diff since ref | `git -C "C:\Projects\website" diff <ref>...HEAD` | |
| Create branch | `git -C "C:\Projects\website" switch -c feature/x` | |
| Worktree list | `git -C "C:\Projects\website" worktree list` | |
| Add worktree | `git -C "C:\Projects\website" worktree add "C:\path" -b branch` | Use an absolute Windows path |

## Project toolchain (Node / npm)

| Purpose | Correct Command | Notes |
|---|---|---|
| Install deps | `npm --prefix "C:\Projects\website" ci` | Use `ci` when lockfile exists |
| Run script | `npm --prefix "C:\Projects\website" run <script>` | Use `npm.cmd` if execution policy blocks `npm.ps1` |
| Run npx tool | `npx --prefix "C:\Projects\website" <tool>` | |
| Node version | `node --version` | |
| Clean install dir | `Remove-Item -LiteralPath "C:\Projects\website\node_modules" -Recurse -Force` | Long-running; use `background: true` if slow |

## Quoting and escaping rules

- **PowerShell:** single quotes = literal, no interpolation. Double quotes interpolate `$var`.
  Use backtick `` ` `` to escape `` ` ``, `$`, `"`. `|` and `>` must be escaped inside double quotes
  or the string must be single-quoted.
- **PowerShell paths:** always wrap in quotes. Prefer `-LiteralPath` so `[`, `]`, `*`, `?` in the
  path are not treated as wildcards.
- **CMD:** `%VAR%` expands, `^` escapes. `&`, `|`, `<`, `>` are shell metacharacters — quote or escape.
- **Both:** use `\` or `/` for path separators; never a leading `/` Unix path.
- **Native exe args containing spaces:** `git log -- "C:\My Folder\file"` needs the `--` separator
  so the tool does not eat the path as a flag.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find path 'C:\b'` from `dir /b` | CMD flag run inside PowerShell | Use `Get-ChildItem -Name` |
| `The term 'X' is not recognized` | Missing exe / PATH | `Get-Command X`; use full path |
| `npm.ps1 cannot be loaded` | PowerShell execution policy | Call `npm.cmd` instead of `npm` |
| `Access is denied` | Missing admin rights | Re-run elevated, or fix ACLs |
| `The term is not recognized ... Select-String` | Pipe broken across tool calls | Keep `|` inside ONE command string |
| Garbled text from `Get-Content` | PS 5.1 ANSI default | Add `-Encoding UTF8` |
| File locked by another process | Editor/node holding handle | Close it, or retry |
| Path too long (>260 chars) | MAX_PATH | Use `\\?\C:\...` prefix |
| `git` reports dubious ownership | Ownership mismatch | `git config --global --add safe.directory "C:/Projects/website"` |

## Rules

- Never silently substitute a different command when one fails. Capture the exact command + full
  error, diagnose (shell / syntax / quoting / path / permissions / missing exe / PATH), record the fix
  here, then retry with corrected syntax.
- Never re-run a failing command unchanged.
- `shell` defaults to a 120s timeout. Use `background: true` for dev servers, installs, and builds.
- Prefer the dedicated `read` / `write` / `edit` / `grep` / `glob` tools over shelling out to
  `Get-Content` / `Set-Content` / `Select-String` / `Get-ChildItem` for repo files.