# ext-name

<a href="https://marketplace.visualstudio.com/items?itemName=antfu.ext-name" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/antfu.ext-name.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>

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

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.png'/>
  </a>
</p>

## License

[MIT](./LICENSE.md) License © 2022 [Anthony Fu](https://github.com/antfu)
