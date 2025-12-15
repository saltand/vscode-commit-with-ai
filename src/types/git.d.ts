/**
 * Type definitions for VS Code's built-in Git extension API
 * @see https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts
 */

import type { Event, Uri } from 'vscode'

export interface GitExtension {
  readonly enabled: boolean
  readonly onDidChangeEnablement: Event<boolean>
  getAPI: (version: 1) => API
}

export interface API {
  readonly state: 'initialized' | 'uninitialized'
  readonly repositories: Repository[]
  readonly onDidOpenRepository: Event<Repository>
  readonly onDidCloseRepository: Event<Repository>
  getRepository: (uri: Uri) => Repository | null
}

export interface Repository {
  readonly rootUri: Uri
  readonly inputBox: InputBox
  readonly state: RepositoryState
  diff: (cached?: boolean) => Promise<string>
}

export interface RepositoryState {
  readonly HEAD: Branch | undefined
  readonly indexChanges: Change[]
  readonly workingTreeChanges: Change[]
  readonly onDidChange: Event<void>
}

export interface InputBox {
  value: string
}

export interface Change {
  readonly uri: Uri
  readonly originalUri: Uri
  readonly renameUri: Uri | undefined
  readonly status: Status
}

export interface Branch {
  readonly name: string
  readonly commit?: string
  readonly remote?: string
}

export const enum Status {
  INDEX_MODIFIED,
  INDEX_ADDED,
  INDEX_DELETED,
  INDEX_RENAMED,
  INDEX_COPIED,
  MODIFIED,
  DELETED,
  UNTRACKED,
  IGNORED,
  INTENT_TO_ADD,
  ADDED_BY_US,
  ADDED_BY_THEM,
  DELETED_BY_US,
  DELETED_BY_THEM,
  BOTH_ADDED,
  BOTH_DELETED,
  BOTH_MODIFIED,
}
