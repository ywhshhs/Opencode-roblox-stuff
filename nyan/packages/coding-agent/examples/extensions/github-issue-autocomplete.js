// Requires GitHub CLI (`gh`) and a GitHub repository checkout.
// Preloads the latest open issues once per session, then filters them locally for fast `#...` completion.
import { fuzzyFilter, } from "@nyan-works/nyan-tui";
const MAX_ISSUES = 100;
const MAX_SUGGESTIONS = 20;
function extractIssueToken(textBeforeCursor) {
    const match = textBeforeCursor.match(/(?:^|[ \t])#([^\s#]*)$/);
    return match?.[1];
}
function parseGitHubRepo(remoteUrl) {
    const sshMatch = remoteUrl.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/);
    if (sshMatch) {
        return sshMatch[1];
    }
    const httpsMatch = remoteUrl.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/);
    if (httpsMatch) {
        return httpsMatch[1];
    }
    return undefined;
}
async function resolveGitHubRepo(pi, cwd) {
    const result = await pi.exec("git", ["remote", "-v"], { cwd, timeout: 5_000 });
    if (result.code !== 0) {
        return { ok: false, error: "github-issue-autocomplete: cwd is not a git repository" };
    }
    for (const line of result.stdout.split("\n")) {
        const columns = line.trim().split(/\s+/);
        const remoteUrl = columns[1];
        if (!remoteUrl) {
            continue;
        }
        const repo = parseGitHubRepo(remoteUrl);
        if (repo) {
            return { ok: true, repo };
        }
    }
    return { ok: false, error: "github-issue-autocomplete: cwd is not a GitHub repository" };
}
function formatIssueItem(issue) {
    return {
        value: `#${issue.number}`,
        label: `#${issue.number}`,
        description: `[${issue.state.toLowerCase()}] ${issue.title}`,
    };
}
function filterIssues(issues, query) {
    if (!query.trim()) {
        return issues.slice(0, MAX_SUGGESTIONS).map(formatIssueItem);
    }
    if (/^\d+$/.test(query)) {
        const numericMatches = issues
            .filter((issue) => String(issue.number).startsWith(query))
            .slice(0, MAX_SUGGESTIONS)
            .map(formatIssueItem);
        if (numericMatches.length > 0) {
            return numericMatches;
        }
    }
    return fuzzyFilter(issues, query, (issue) => `${issue.number} ${issue.title}`)
        .slice(0, MAX_SUGGESTIONS)
        .map(formatIssueItem);
}
function createIssueAutocompleteProvider(current, getIssues) {
    return {
        async getSuggestions(lines, cursorLine, cursorCol, options) {
            const currentLine = lines[cursorLine] ?? "";
            const textBeforeCursor = currentLine.slice(0, cursorCol);
            const token = extractIssueToken(textBeforeCursor);
            if (token === undefined) {
                return current.getSuggestions(lines, cursorLine, cursorCol, options);
            }
            const issues = await getIssues();
            if (options.signal.aborted || !issues || issues.length === 0) {
                return current.getSuggestions(lines, cursorLine, cursorCol, options);
            }
            const suggestions = filterIssues(issues, token);
            if (suggestions.length === 0) {
                return current.getSuggestions(lines, cursorLine, cursorCol, options);
            }
            return {
                items: suggestions,
                prefix: `#${token}`,
            };
        },
        applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
            return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
        },
        shouldTriggerFileCompletion(lines, cursorLine, cursorCol) {
            return current.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ?? true;
        },
    };
}
export default function (pi) {
    pi.on("session_start", async (_event, ctx) => {
        const resolvedRepo = await resolveGitHubRepo(pi, ctx.cwd);
        if (!resolvedRepo.ok) {
            ctx.ui.notify(resolvedRepo.error, "error");
            return;
        }
        const repo = resolvedRepo.repo;
        let issuesPromise;
        let loadErrorShown = false;
        const getIssues = async () => {
            issuesPromise ||= (async () => {
                const result = await pi.exec("gh", [
                    "issue",
                    "list",
                    "--repo",
                    repo,
                    "--state",
                    "open",
                    "--limit",
                    String(MAX_ISSUES),
                    "--json",
                    "number,title,state",
                ], { cwd: ctx.cwd, timeout: 5_000 });
                if (result.code !== 0) {
                    if (!loadErrorShown) {
                        loadErrorShown = true;
                        const details = result.stderr.trim() || `exit code ${result.code}`;
                        ctx.ui.notify(`github-issue-autocomplete: failed to load issues: ${details}`, "error");
                    }
                    return undefined;
                }
                try {
                    return JSON.parse(result.stdout);
                }
                catch {
                    if (!loadErrorShown) {
                        loadErrorShown = true;
                        ctx.ui.notify("github-issue-autocomplete: failed to parse gh issue list output", "error");
                    }
                    return undefined;
                }
            })();
            return issuesPromise;
        };
        void getIssues();
        ctx.ui.addAutocompleteProvider((current) => createIssueAutocompleteProvider(current, getIssues));
    });
}
//# sourceMappingURL=github-issue-autocomplete.js.map