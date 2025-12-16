import { defineExtension, useCommand, useVscodeContext } from 'reactive-vscode'
import { ProgressLocation, window } from 'vscode'
import { cancelAIRequest } from './ai'
import { generateCommitMessage } from './generate'
import { formatError, logger } from './utils'

const { activate, deactivate } = defineExtension(() => {
  // State management for generating status
  const isGenerating = useVscodeContext('commitgen.isGenerating', false)

  // Register generate command
  useCommand('commitgen.generate', async () => {
    // Prevent duplicate requests
    if (isGenerating.value) {
      return
    }

    isGenerating.value = true

    try {
      await window.withProgress(
        {
          location: ProgressLocation.SourceControl,
          title: 'CommitGen: generating...',
          cancellable: false,
        },
        async () => {
          await generateCommitMessage()
        },
      )
    }
    catch (error) {
      const errorMessage = formatError(error)
      // Don't show error for user-initiated cancellation
      if (!errorMessage.includes('cancelled by user')) {
        logger.error('Generate failed:', error)
        window.showErrorMessage(`CommitGen: ${errorMessage}`)
      }
    }
    finally {
      isGenerating.value = false
    }
  })

  // Register cancel command
  useCommand('commitgen.cancel', () => {
    if (isGenerating.value) {
      const cancelled = cancelAIRequest()
      if (cancelled) {
        logger.info('AI request cancelled by user')
      }
      isGenerating.value = false
    }
  })
})

export { activate, deactivate }
