/**
 * Extensions Configuration
 *
 * Extensions intercept agent events and can register custom tools.
 * They provide a unified system for extensions, custom tools, commands, and more.
 *
 * By default, extension files are discovered from:
 * - ~/.nyan/agent/extensions/
 * - <cwd>/.nyan/extensions/
 * - Paths specified in settings.json "extensions" array
 *
 * An extension is a TypeScript file that exports a default function:
 *   export default function (pi: ExtensionAPI) { ... }
 */
export {};
//# sourceMappingURL=06-extensions.d.ts.map