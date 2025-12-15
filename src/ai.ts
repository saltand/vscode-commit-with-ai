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

/**
 * Call OpenAI-compatible Chat Completions API
 */
export async function callAI(prompt: string): Promise<string> {
  const baseUrl = config.aiBaseUrl.replace(/\/$/, '') // Remove trailing slash
  const endpoint = `${baseUrl}/chat/completions`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout

  try {
    logger.info(`Calling AI API: ${endpoint}`)

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

    return content.trim()
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 60 seconds')
    }
    throw error
  }
  finally {
    clearTimeout(timeout)
  }
}
