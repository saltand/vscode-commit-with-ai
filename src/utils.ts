import { useLogger } from 'reactive-vscode'
import { displayName } from './generated/meta'

export const logger = useLogger(displayName)

/**
 * Truncate diff content to prevent token overflow
 */
export function truncateDiff(diff: string, maxLength: number): string {
  if (diff.length <= maxLength) {
    return diff
  }

  const truncated = diff.substring(0, maxLength)
  const suffix = '\n\n...(diff truncated due to size limit)...'

  // Try to truncate at the last complete line
  const lastNewline = truncated.lastIndexOf('\n')
  if (lastNewline > maxLength * 0.9) {
    return truncated.substring(0, lastNewline) + suffix
  }

  return truncated + suffix
}

/**
 * Format error message, sanitizing sensitive information
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    // Remove sensitive information (API key)
    return error.message.replace(/Bearer \S+/g, 'Bearer ***')
  }
  return String(error)
}
