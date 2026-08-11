import {
  bodyForStyle,
  endpointForStyle,
  extractNonStreamContent,
  extractStreamDelta,
  headersForStyle,
  resolveApiStyle,
} from './ai-api'
import { config } from './config'
import { logger } from './utils'

export type { AiApiStyle } from './ai-api'
export {
  AI_API_STYLES,
  bodyForStyle,
  endpointForStyle,
  extractNonStreamContent,
  extractStreamDelta,
  headersForStyle,
  resolveApiStyle,
} from './ai-api'

const REQUEST_TIMEOUT_MS = 60_000

interface BuiltRequest {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, unknown>
}

// Current AbortController for cancellation support
let currentController: AbortController | null = null
let isCancelledByUser = false

/**
 * Cancel the current AI request if one is in progress
 */
export function cancelAIRequest(): boolean {
  if (currentController) {
    isCancelledByUser = true
    currentController.abort()
    currentController = null
    return true
  }
  return false
}

function buildRequest(prompt: string, stream: boolean): BuiltRequest {
  const style = resolveApiStyle(config.aiApiStyle)
  return {
    endpoint: endpointForStyle(config.aiBaseUrl, style),
    headers: headersForStyle(config.aiKey, style),
    body: bodyForStyle(style, config.aiModel, prompt, stream),
  }
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  style: ReturnType<typeof resolveApiStyle>,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      // Skip event: lines (Anthropic named SSE) and empty lines
      if (!trimmed || !trimmed.startsWith('data:'))
        continue

      // Support both "data: {...}" and "data:{...}"
      const payload = trimmed.slice(5).trimStart()
      if (!payload || payload === '[DONE]')
        continue

      try {
        const parsed = JSON.parse(payload) as unknown
        const content = extractStreamDelta(style, parsed)
        if (content) {
          fullContent += content
          onChunk?.(content)
        }
      }
      catch {
        // Ignore JSON parse errors for malformed chunks
      }
    }
  }

  return fullContent
}

function mapAbortError(error: unknown): never {
  if (error instanceof Error && error.name === 'AbortError') {
    if (isCancelledByUser)
      throw new Error('Request cancelled by user')
    throw new Error('Request timeout after 60 seconds')
  }
  throw error
}

/**
 * Call AI API (non-streaming). Supports chat.completions / responses / messages.
 */
export async function callAI(prompt: string): Promise<string> {
  const style = resolveApiStyle(config.aiApiStyle)
  const { endpoint, headers, body } = buildRequest(prompt, false)

  isCancelledByUser = false
  const controller = new AbortController()
  currentController = controller
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    logger.info(`Calling AI API (non-streaming, ${style}): ${endpoint}`)
    logger.info(`--- Prompt ---\n${prompt}`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = extractNonStreamContent(style, data)

    logger.info(`--- AI Response ---\n${content}`)
    return content.trim()
  }
  catch (error) {
    mapAbortError(error)
  }
  finally {
    clearTimeout(timeout)
    currentController = null
  }
}

/**
 * Call AI API with streaming support. Supports chat.completions / responses / messages.
 */
export async function callAIStream(
  prompt: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const style = resolveApiStyle(config.aiApiStyle)
  const { endpoint, headers, body } = buildRequest(prompt, true)

  isCancelledByUser = false
  const controller = new AbortController()
  currentController = controller
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    logger.info(`Calling AI API (streaming, ${style}): ${endpoint}`)
    logger.info(`--- Prompt ---\n${prompt}`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed (${response.status}): ${errorText}`)
    }

    if (!response.body)
      throw new Error('Response body is null')

    const fullContent = await readSseStream(response.body, style, onChunk)

    if (!fullContent)
      throw new Error('AI returned empty response')

    logger.info(`--- AI Response ---\n${fullContent}`)
    return fullContent.trim()
  }
  catch (error) {
    mapAbortError(error)
  }
  finally {
    clearTimeout(timeout)
    currentController = null
  }
}
