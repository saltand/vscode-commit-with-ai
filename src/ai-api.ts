/** Supported AI HTTP API styles */
export type AiApiStyle = 'chat.completions' | 'responses' | 'messages'

export const AI_API_STYLES: readonly AiApiStyle[] = [
  'chat.completions',
  'responses',
  'messages',
] as const

export const DEFAULT_MAX_TOKENS = 4096

/**
 * Normalize and validate the configured API style.
 */
export function resolveApiStyle(style?: string): AiApiStyle {
  const value = (style ?? 'chat.completions').trim()
  if ((AI_API_STYLES as readonly string[]).includes(value))
    return value as AiApiStyle
  throw new Error(
    `Unsupported commitgen.aiApiStyle "${value}". Expected one of: ${AI_API_STYLES.join(', ')}`,
  )
}

/**
 * Build endpoint path relative to base URL for the given API style.
 */
export function endpointForStyle(baseUrl: string, style: AiApiStyle): string {
  const base = baseUrl.replace(/\/$/, '')
  switch (style) {
    case 'chat.completions':
      return `${base}/chat/completions`
    case 'responses':
      return `${base}/responses`
    case 'messages':
      return `${base}/messages`
  }
}

/**
 * Build request headers for the given API style.
 * Messages API uses Anthropic headers; also sends Bearer for proxy compatibility.
 */
export function headersForStyle(apiKey: string, style: AiApiStyle): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (style === 'messages') {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
    // Many OpenAI-compatible proxies accept Bearer for Anthropic-format routes too
    headers.Authorization = `Bearer ${apiKey}`
  }
  else {
    headers.Authorization = `Bearer ${apiKey}`
  }

  return headers
}

/**
 * Build JSON body for the given API style.
 */
export function bodyForStyle(
  style: AiApiStyle,
  model: string,
  prompt: string,
  stream: boolean,
): Record<string, unknown> {
  switch (style) {
    case 'chat.completions':
      return {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        stream,
      }
    case 'responses':
      return {
        model,
        input: prompt,
        temperature: 0.2,
        stream,
      }
    case 'messages':
      return {
        model,
        max_tokens: DEFAULT_MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        stream,
      }
  }
}

/**
 * Extract assistant text from a non-streaming JSON response.
 */
export function extractNonStreamContent(style: AiApiStyle, data: unknown): string {
  if (!data || typeof data !== 'object')
    throw new Error('AI returned invalid response')

  const obj = data as Record<string, unknown>

  switch (style) {
    case 'chat.completions': {
      const choices = obj.choices as Array<{ message?: { content?: string } }> | undefined
      const content = choices?.[0]?.message?.content
      if (!content)
        throw new Error('AI returned empty response')
      return content
    }
    case 'responses': {
      // Preferred convenience field on official Responses API
      if (typeof obj.output_text === 'string' && obj.output_text.trim())
        return obj.output_text

      // Fallback: walk output[].content[].text for message items
      const output = obj.output as Array<{
        type?: string
        content?: Array<{ type?: string, text?: string }>
      }> | undefined

      if (Array.isArray(output)) {
        const parts: string[] = []
        for (const item of output) {
          if (!item?.content)
            continue
          for (const part of item.content) {
            if (part?.type === 'output_text' && typeof part.text === 'string')
              parts.push(part.text)
            else if (typeof part?.text === 'string')
              parts.push(part.text)
          }
        }
        const joined = parts.join('')
        if (joined)
          return joined
      }

      throw new Error('AI returned empty response')
    }
    case 'messages': {
      const content = obj.content as Array<{ type?: string, text?: string }> | undefined
      if (Array.isArray(content)) {
        const text = content
          .filter(block => block?.type === 'text' && typeof block.text === 'string')
          .map(block => block.text!)
          .join('')
        if (text)
          return text
      }
      throw new Error('AI returned empty response')
    }
  }
}

/**
 * Extract a text delta from a single streaming SSE JSON payload.
 * Returns null when the event carries no text.
 */
export function extractStreamDelta(style: AiApiStyle, data: unknown): string | null {
  if (!data || typeof data !== 'object')
    return null

  const obj = data as Record<string, unknown>

  switch (style) {
    case 'chat.completions': {
      const choices = obj.choices as Array<{ delta?: { content?: string } }> | undefined
      const content = choices?.[0]?.delta?.content
      return typeof content === 'string' ? content : null
    }
    case 'responses': {
      // Official: response.output_text.delta
      if (obj.type === 'response.output_text.delta' && typeof obj.delta === 'string')
        return obj.delta
      // Some proxies may omit type or use slightly different shapes
      if (typeof obj.delta === 'string' && typeof obj.type === 'string' && obj.type.includes('output_text'))
        return obj.delta
      return null
    }
    case 'messages': {
      // Anthropic: content_block_delta with text_delta
      if (obj.type === 'content_block_delta') {
        const delta = obj.delta as { type?: string, text?: string } | undefined
        if (delta?.type === 'text_delta' && typeof delta.text === 'string')
          return delta.text
        if (typeof delta?.text === 'string')
          return delta.text
      }
      return null
    }
  }
}
