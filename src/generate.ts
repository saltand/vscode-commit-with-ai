import { window } from 'vscode'
import { callAI, callAIStream } from './ai'
import { config, validateConfig } from './config'
import { getCommitHistory, getStagedData, selectRepository } from './git'
import { logger, truncateDiff } from './utils'

/**
 * Main function to generate commit message from staged changes
 */
export async function generateCommitMessage(): Promise<void> {
  // 1. Validate configuration
  const configValidation = validateConfig()
  if (!configValidation.valid) {
    throw new Error(configValidation.message)
  }

  // 2. Select repository
  const repo = await selectRepository()
  logger.info(`Selected repository: ${repo.rootUri.fsPath}`)

  // 3. Get staged data
  const { files, diff } = await getStagedData(repo)
  logger.info(`Staged files: ${files.length}`)

  if (files.length > 200) {
    window.showWarningMessage(`CommitGen: ${files.length} files staged, this may take longer.`)
  }

  // 4. Truncate diff (prevent token overflow)
  const maxLength = config.maxDiffLength || 120000
  const truncatedDiff = truncateDiff(diff, maxLength)

  if (diff.length > maxLength) {
    logger.warn(`Diff truncated from ${diff.length} to ${maxLength} characters`)
  }

  // 5. Get commit history
  const history = await getCommitHistory(repo, 10)
  logger.info(`Got ${history.split('\n').length} recent commits`)

  // 6. Assemble prompt
  const filesText = files.join('\n')
  const prompt = config.prompt
    .replace(/\{\{files\}\}/g, filesText)
    .replace(/\{\{diff\}\}/g, truncatedDiff)
    .replace(/\{\{history\}\}/g, history)

  logger.info(`Prompt assembled, length: ${prompt.length}`)

  // 7. Call AI
  let commitMessage: string
  repo.inputBox.value = '' // Clear input box

  if (config.streaming) {
    // Streaming mode: update input box in real-time
    commitMessage = await callAIStream(prompt, (chunk) => {
      repo.inputBox.value += chunk
    })
  }
  else {
    // Non-streaming mode: wait for full response
    commitMessage = await callAI(prompt)
  }
  logger.info('AI response received')

  // 8. Write final result to inputBox (trimmed)
  repo.inputBox.value = commitMessage.trim()
}
