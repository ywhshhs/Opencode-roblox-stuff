#!/usr/bin/env node
import { configureHttpDispatcher } from "./core/http-dispatcher.js";
import { main } from "./main.js";
process.title = "nyan";
process.env.NYAN_CODING_AGENT = "true";
process.emitWarning = (() => { });
// Configure undici's global dispatcher before provider SDKs issue requests.
// Runtime settings are applied once SettingsManager has loaded global/project settings.
configureHttpDispatcher();
main(process.argv.slice(2));
//# sourceMappingURL=cli.js.map