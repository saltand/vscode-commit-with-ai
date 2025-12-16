import type { API, Change, GitExtension, Repository } from './types/git'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { extensions, window, workspace } from 'vscode'

const execAsync = promisify(exec)

let gitApi: API | undefined

/**
 * Get the Git extension API
 */
export function getGitApi(): API {
  if (gitApi)
    return gitApi

  const gitExtension = extensions.getExtension<GitExtension>('vscode.git')
  if (!gitExtension) {
    throw new Error('Git extension not found. Please enable the built-in Git extension.')
  }

  if (!gitExtension.isActive) {
    throw new Error('Git extension is not active.')
  }

  gitApi = gitExtension.exports.getAPI(1)
  return gitApi
}

/**
 * Select a repository from available repositories
 * Shows QuickPick if multiple repositories exist
 */
export async function selectRepository(): Promise<Repository> {
  const api = getGitApi()
  const repos = api.repositories

  if (repos.length === 0) {
    throw new Error('No Git repository found in workspace.')
  }

  if (repos.length === 1) {
    return repos[0]
  }

  // Multiple repositories: show QuickPick
  const items = repos.map(repo => ({
    label: workspace.asRelativePath(repo.rootUri),
    description: repo.rootUri.fsPath,
    repo,
  }))

  const selected = await window.showQuickPick(items, {
    placeHolder: 'Select a repository',
  })

  if (!selected) {
    throw new Error('No repository selected.')
  }

  return selected.repo
}

export interface StagedData {
  /** Relative paths of staged files */
  files: string[]
  /** Staged diff content */
  diff: string
}

/**
 * Get staged files and diff from a repository
 * Falls back to working tree changes if no staged changes exist
 */
export async function getStagedData(repo: Repository): Promise<StagedData> {
  const indexChanges: Change[] = repo.state.indexChanges
  const workingTreeChanges: Change[] = repo.state.workingTreeChanges

  // Use staged changes if available, otherwise fall back to working tree changes
  const changes = indexChanges.length > 0 ? indexChanges : workingTreeChanges
  const isStaged = indexChanges.length > 0

  if (changes.length === 0) {
    throw new Error('No changes found. Please make some changes first.')
  }

  // Get relative path file list
  const files = changes.map(change =>
    workspace.asRelativePath(change.uri),
  )

  // Get diff: cached=true for staged, cached=false for working tree
  const diff = await repo.diff(isStaged)

  return { files, diff }
}

/**
 * Get recent commit history from a repository
 * @param repo Repository instance
 * @param count Number of commits to retrieve (default: 10)
 */
export async function getCommitHistory(repo: Repository, count: number = 10): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `git log --oneline -n ${count} --format="%s"`,
      { cwd: repo.rootUri.fsPath },
    )
    return stdout.trim()
  }
  catch {
    // Return empty string if git log fails
    return ''
  }
}
