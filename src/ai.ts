import { config } from './config'
import { logger } from './utils'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface ChatCompletionChunk {
  choices: Array<{
    delta: {
      content?: string
    }
  }>
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

/**
 * Call OpenAI-compatible Chat Completions API (non-streaming)
 */
export async function callAI(prompt: string): Promise<string> {
  const baseUrl = config.aiBaseUrl.replace(/\/$/, '')
  const endpoint = `${baseUrl}/chat/completions`

  isCancelledByUser = false
  const controller = new AbortController()
  currentController = controller
  const timeout = setTimeout(() => controller.abort(), 60000)

  try {
    logger.info(`Calling AI API (non-streaming): ${endpoint}`)
    logger.info(`--- Prompt ---\n${prompt}`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.aiKey}`,
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages: [
          { role: 'user', content: prompt },
        ] as ChatMessage[],
        temperature: 0.2,
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json() as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('AI returned empty response')
    }

    logger.info(`--- AI Response ---\n${content}`)

    return content.trim()
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      if (isCancelledByUser) {
        throw new Error('Request cancelled by user')
      }
      throw new Error('Request timeout after 60 seconds')
    }
    throw error
  }
  finally {
    clearTimeout(timeout)
    currentController = null
  }
}

/**
 * Call OpenAI-compatible Chat Completions API with streaming support
 */
export async function callAIStream(
  prompt: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const baseUrl = config.aiBaseUrl.replace(/\/$/, '') // Remove trailing slash
  const endpoint = `${baseUrl}/chat/completions`

  isCancelledByUser = false
  const controller = new AbortController()
  currentController = controller
  const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout

  try {
    logger.info(`Calling AI API: ${endpoint}`)
    logger.info(`--- Prompt ---\n${prompt}`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.aiKey}`,
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages: [
          { role: 'user', content: prompt },
        ] as ChatMessage[],
        temperature: 0.2,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed (${response.status}): ${errorText}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: '))
          continue

        const data = trimmed.slice(6) // Remove 'data: ' prefix
        if (data === '[DONE]')
          continue

        try {
          const chunk = JSON.parse(data) as ChatCompletionChunk
          const content = chunk.choices?.[0]?.delta?.content
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

    if (!fullContent) {
      throw new Error('AI returned empty response')
    }

    logger.info(`--- AI Response ---\n${fullContent}`)

    return fullContent.trim()
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      if (isCancelledByUser) {
        throw new Error('Request cancelled by user')
      }
      throw new Error('Request timeout after 60 seconds')
    }
    throw error
  }
  finally {
    clearTimeout(timeout)
    currentController = null
  }
}
