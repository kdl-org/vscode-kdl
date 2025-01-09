"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("node:path");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
async function activate(context) {
    const traceOutputChannel = vscode_1.window.createOutputChannel("KDL LSP Client");
    const config = vscode_1.workspace.getConfiguration("kdl");
    const run = {
        command: process.env.SERVER_PATH ||
            config.get("command") ||
            path.join(context.extensionPath, "node_modules", ".bin", "kdl-lsp"),
        args: config.get("argv", []),
        options: {
            env: {
                ...process.env,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                RUST_LOG: config.get("loglevel", "debug"),
            },
        },
    };
    const serverOptions = {
        run,
        debug: run,
    };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: "file", language: "kdl" }],
        outputChannel: vscode_1.window.createOutputChannel("KDL Language Server Stderr"),
        traceOutputChannel,
        diagnosticPullOptions: {
            onChange: true,
            onSave: true,
            onTabs: false,
        },
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient("kdl-lsp", "KDL Language Server", serverOptions, clientOptions);
    client.start();
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map