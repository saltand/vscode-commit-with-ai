import type { ScopedConfigKeyTypeMap } from './generated/meta'
import { defineConfigObject } from 'reactive-vscode'
import { scopedConfigs } from './generated/meta'

export const config = defineConfigObject<ScopedConfigKeyTypeMap>(
  scopedConfigs.scope,
  scopedConfigs.defaults,
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
