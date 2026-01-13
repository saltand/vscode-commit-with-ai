# Yet Another Commit Message Generator

<a href="https://marketplace.visualstudio.com/items?itemName=saltand.yet-another-commit-message-generator" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/saltand.yet-another-commit-message-generator.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>

Generate commit messages from staged changes using AI. Supports any OpenAI-compatible API.

## Configurations

<!-- configs -->

| Key                       | Description                                                                                                                       | Type      | Default                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------- |
| `commitgen.aiBaseUrl`     | AI service base URL (OpenAI-compatible)                                                                                           | `string`  | `"https://openrouter.ai/api/v1"` |
| `commitgen.aiModel`       | AI model name                                                                                                                     | `string`  | `"deepseek/deepseek-chat"`       |
| `commitgen.aiKey`         | API Key for AI service                                                                                                            | `string`  | `""`                             |
| `commitgen.prompt`        | Prompt template. Use {{files}} for staged file list, {{diff}} for staged diff content, and {{history}} for recent commit messages | `string`  | See package.json                 |
| `commitgen.maxDiffLength` | Maximum diff length in characters (to prevent token overflow)                                                                     | `number`  | `120000`                         |
| `commitgen.streaming`     | Enable streaming output for AI responses                                                                                          | `boolean` | `false`                          |

<!-- configs -->

## Commands

<!-- commands -->

| Command              | Title                              |
| -------------------- | ---------------------------------- |
| `commitgen.generate` | CommitGen: Generate Commit Message |
| `commitgen.cancel`   | CommitGen: Cancel Generation       |

<!-- commands -->

## License

[MIT](./LICENSE.md) License
