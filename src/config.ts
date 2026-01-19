import type { NestedConfigs } from './generated/meta'
import { defineConfigObject } from 'reactive-vscode'
import { configs } from './generated/meta'

export const config = defineConfigObject<NestedConfigs['commitgen']>(
  'commitgen',
  {
    aiBaseUrl: configs.commitgenAiBaseUrl.default,
    aiModel: configs.commitgenAiModel.default,
    aiKey: configs.commitgenAiKey.default,
    prompt: configs.commitgenPrompt.default,
    maxDiffLength: configs.commitgenMaxDiffLength.default,
    streaming: configs.commitgenStreaming.default,
  },
)

export interface ConfigValidationResult {
  valid: boolean
  message?: string
}

/**
 * Validate required configuration items
 */
export function validateConfig(): ConfigValidationResult {
  if (!config.aiBaseUrl) {
    return { valid: false, message: 'Please configure commitgen.aiBaseUrl in settings' }
  }
  if (!config.aiModel) {
    return { valid: false, message: 'Please configure commitgen.aiModel in settings' }
  }
  if (!config.aiKey) {
    return { valid: false, message: 'Please configure commitgen.aiKey in settings' }
  }
  return { valid: true }
}
