# Changelog

All notable changes to "Yet Another Commit Message Generator" will be documented in this file.

## [Unreleased]

## [1.0.10]

- Require the default commit prompt to output plain text only, without markdown formatting

## [1.0.9]

- Support multiple AI API styles via `commitgen.aiApiStyle`:
  - `chat.completions` — OpenAI Chat Completions (`/chat/completions`)
  - `responses` — OpenAI Responses API (`/responses`)
  - `messages` — Anthropic Messages API (`/messages`)
- Streaming and non-streaming work for all three styles

## [1.0.6]

- Renamed extension to "Yet Another Commit Message Generator"
- Updated repository and metadata

## [1.0.5]

- Initial release
- Generate commit messages from staged changes using AI
- Support for OpenAI-compatible APIs
- Customizable prompts with template variables
- Streaming output support
- Configurable max diff length
