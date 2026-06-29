/**
 * Default themes for TUI tests using chalk
 */
import { Chalk } from "chalk";
const chalk = new Chalk({ level: 3 });
export const defaultSelectListTheme = {
    selectedPrefix: (text) => chalk.blue(text),
    selectedText: (text) => chalk.bold(text),
    description: (text) => chalk.dim(text),
    scrollInfo: (text) => chalk.dim(text),
    noMatch: (text) => chalk.dim(text),
};
export const defaultMarkdownTheme = {
    heading: (text) => chalk.bold.cyan(text),
    link: (text) => chalk.blue(text),
    linkUrl: (text) => chalk.dim(text),
    code: (text) => chalk.yellow(text),
    codeBlock: (text) => chalk.green(text),
    codeBlockBorder: (text) => chalk.dim(text),
    quote: (text) => chalk.italic(text),
    quoteBorder: (text) => chalk.dim(text),
    hr: (text) => chalk.dim(text),
    listBullet: (text) => chalk.cyan(text),
    bold: (text) => chalk.bold(text),
    italic: (text) => chalk.italic(text),
    strikethrough: (text) => chalk.strikethrough(text),
    underline: (text) => chalk.underline(text),
};
export const defaultEditorTheme = {
    borderColor: (text) => chalk.dim(text),
    selectList: defaultSelectListTheme,
};
//# sourceMappingURL=test-themes.js.map