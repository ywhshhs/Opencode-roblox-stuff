/**
 * Pi Notify Extension
 *
 * Sends a native terminal notification when Pi agent is done and waiting for input.
 * Supports multiple terminal protocols:
 * - OSC 777: Ghostty, iTerm2, WezTerm, rxvt-unicode
 * - OSC 99: Kitty
 * - Windows toast: Windows Terminal (WSL)
 */
function windowsToastScript(title, body) {
    const type = "Windows.UI.Notifications";
    const mgr = `[${type}.ToastNotificationManager, ${type}, ContentType = WindowsRuntime]`;
    const template = `[${type}.ToastTemplateType]::ToastText01`;
    const toast = `[${type}.ToastNotification]::new($xml)`;
    return [
        `${mgr} > $null`,
        `$xml = [${type}.ToastNotificationManager]::GetTemplateContent(${template})`,
        `$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${body}')) > $null`,
        `[${type}.ToastNotificationManager]::CreateToastNotifier('${title}').Show(${toast})`,
    ].join("; ");
}
function notifyOSC777(title, body) {
    process.stdout.write(`\x1b]777;notify;${title};${body}\x07`);
}
function notifyOSC99(title, body) {
    // Kitty OSC 99: i=notification id, d=0 means not done yet, p=body for second part
    process.stdout.write(`\x1b]99;i=1:d=0;${title}\x1b\\`);
    process.stdout.write(`\x1b]99;i=1:p=body;${body}\x1b\\`);
}
function notifyWindows(title, body) {
    const { execFile } = require("child_process");
    execFile("powershell.exe", ["-NoProfile", "-Command", windowsToastScript(title, body)]);
}
function notify(title, body) {
    if (process.env.WT_SESSION) {
        notifyWindows(title, body);
    }
    else if (process.env.KITTY_WINDOW_ID) {
        notifyOSC99(title, body);
    }
    else {
        notifyOSC777(title, body);
    }
}
export default function (pi) {
    pi.on("agent_end", async () => {
        notify("Pi", "Ready for input");
    });
}
//# sourceMappingURL=notify.js.map