import { defineExtension, useCommand, useVscodeContext } from 'reactive-vscode'
import { ProgressLocation, window } from 'vscode'
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
      logger.error('Generate failed:', error)
      window.showErrorMessage(`CommitGen: ${formatError(error)}`)
    }
    finally {
      isGenerating.value = false
    }
  })
})

export { activate, deactivate }
