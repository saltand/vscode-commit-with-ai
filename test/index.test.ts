import { describe, expect, it } from 'vitest'
import {
  bodyForStyle,
  endpointForStyle,
  extractNonStreamContent,
  extractStreamDelta,
  headersForStyle,
  resolveApiStyle,
} from '../src/ai-api'

describe('resolveApiStyle', () => {
  it('defaults to chat.completions', () => {
    expect(resolveApiStyle(undefined)).toBe('chat.completions')
  })

  it('accepts all supported styles', () => {
    expect(resolveApiStyle('chat.completions')).toBe('chat.completions')
    expect(resolveApiStyle('responses')).toBe('responses')
    expect(resolveApiStyle('messages')).toBe('messages')
  })

  it('rejects unknown styles', () => {
    expect(() => resolveApiStyle('graphql')).toThrow(/Unsupported/)
  })
})

describe('endpointForStyle', () => {
  const base = 'https://api.example.com/v1/'

  it('builds chat completions path', () => {
    expect(endpointForStyle(base, 'chat.completions')).toBe(
      'https://api.example.com/v1/chat/completions',
    )
  })

  it('builds responses path', () => {
    expect(endpointForStyle(base, 'responses')).toBe(
      'https://api.example.com/v1/responses',
    )
  })

  it('builds messages path', () => {
    expect(endpointForStyle(base, 'messages')).toBe(
      'https://api.example.com/v1/messages',
    )
  })
})

describe('headersForStyle', () => {
  it('uses Bearer for chat.completions', () => {
    expect(headersForStyle('sk-test', 'chat.completions')).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-test',
    })
  })

  it('uses Bearer for responses', () => {
    expect(headersForStyle('sk-test', 'responses').Authorization).toBe('Bearer sk-test')
  })

  it('uses Anthropic headers for messages (plus Bearer for proxies)', () => {
    expect(headersForStyle('sk-ant', 'messages')).toEqual({
      'Content-Type': 'application/json',
      'x-api-key': 'sk-ant',
      'anthropic-version': '2023-06-01',
      'Authorization': 'Bearer sk-ant',
    })
  })
})

describe('bodyForStyle', () => {
  it('builds chat.completions body', () => {
    expect(bodyForStyle('chat.completions', 'gpt-4o-mini', 'hello', false)).toEqual({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.2,
      stream: false,
    })
  })

  it('builds responses body with input string', () => {
    expect(bodyForStyle('responses', 'gpt-5', 'hello', true)).toEqual({
      model: 'gpt-5',
      input: 'hello',
      temperature: 0.2,
      stream: true,
    })
  })

  it('builds messages body with required max_tokens', () => {
    const body = bodyForStyle('messages', 'claude-sonnet', 'hello', false)
    expect(body).toMatchObject({
      model: 'claude-sonnet',
      max_tokens: 4096,
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.2,
      stream: false,
    })
  })
})

describe('extractNonStreamContent', () => {
  it('parses chat.completions', () => {
    expect(extractNonStreamContent('chat.completions', {
      choices: [{ message: { content: 'feat: add login' } }],
    })).toBe('feat: add login')
  })

  it('parses responses via output_text', () => {
    expect(extractNonStreamContent('responses', {
      output_text: 'fix: crash on empty',
    })).toBe('fix: crash on empty')
  })

  it('parses responses via output items fallback', () => {
    expect(extractNonStreamContent('responses', {
      output: [{
        type: 'message',
        content: [{ type: 'output_text', text: 'chore: bump deps' }],
      }],
    })).toBe('chore: bump deps')
  })

  it('parses messages content blocks', () => {
    expect(extractNonStreamContent('messages', {
      content: [
        { type: 'text', text: 'docs: ' },
        { type: 'text', text: 'update readme' },
      ],
    })).toBe('docs: update readme')
  })

  it('throws on empty chat.completions', () => {
    expect(() => extractNonStreamContent('chat.completions', { choices: [] }))
      .toThrow(/empty/)
  })
})

describe('extractStreamDelta', () => {
  it('parses chat.completions delta', () => {
    expect(extractStreamDelta('chat.completions', {
      choices: [{ delta: { content: 'feat' } }],
    })).toBe('feat')
  })

  it('parses responses output_text delta', () => {
    expect(extractStreamDelta('responses', {
      type: 'response.output_text.delta',
      delta: 'fix',
    })).toBe('fix')
  })

  it('ignores non-text responses events', () => {
    expect(extractStreamDelta('responses', {
      type: 'response.created',
      response: {},
    })).toBeNull()
  })

  it('parses messages content_block_delta', () => {
    expect(extractStreamDelta('messages', {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'docs' },
    })).toBe('docs')
  })

  it('ignores message_start for messages', () => {
    expect(extractStreamDelta('messages', {
      type: 'message_start',
      message: {},
    })).toBeNull()
  })
})
