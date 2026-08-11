# Yet Another Commit Message Generator

<a href="https://marketplace.visualstudio.com/items?itemName=saltand.yet-another-commit-message-generator" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/saltand.yet-another-commit-message-generator.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>

Generate commit messages from staged changes using AI. Supports OpenAI Chat Completions, OpenAI Responses, and Anthropic Messages APIs.

## Configurations

<!-- configs -->

| Key                       | Description                                                                                                                       | Type      | Default                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------- |
| `commitgen.aiBaseUrl`     | AI service base URL                                                                                                               | `string`  | `"https://openrouter.ai/api/v1"` |
| `commitgen.aiModel`       | AI model name                                                                                                                     | `string`  | `"deepseek/deepseek-chat"`       |
| `commitgen.aiKey`         | API Key for AI service                                                                                                            | `string`  | `""`                             |
| `commitgen.aiApiStyle`    | API style: `chat.completions`, `responses`, or `messages`                                                                         | `string`  | `"chat.completions"`             |
| `commitgen.prompt`        | Prompt template. Use {{files}} for staged file list, {{diff}} for staged diff content, and {{history}} for recent commit messages | `string`  | See package.json                 |
| `commitgen.maxDiffLength` | Maximum diff length in characters (to prevent token overflow)                                                                     | `number`  | `120000`                         |
| `commitgen.streaming`     | Enable streaming output for AI responses                                                                                          | `boolean` | `false`                          |

<!-- configs -->

### API styles

| Style              | Endpoint                 | Typical providers                                      |
| ------------------ | ------------------------ | ------------------------------------------------------ |
| `chat.completions` | `POST /chat/completions` | OpenAI, OpenRouter, most OpenAI-compatible proxies     |
| `responses`        | `POST /responses`        | OpenAI Responses API and compatible gateways           |
| `messages`         | `POST /messages`         | Anthropic Claude (`x-api-key` + `anthropic-version`)   |

Set `commitgen.aiBaseUrl` to the provider root that already includes any version prefix (e.g. `https://api.openai.com/v1` or `https://api.anthropic.com/v1`).

## Commands

<!-- commands -->

| Command              | Title                              |
| -------------------- | ---------------------------------- |
| `commitgen.generate` | CommitGen: Generate Commit Message |
| `commitgen.cancel`   | CommitGen: Cancel Generation       |

<!-- commands -->

## License

[MIT](./LICENSE.md) License
