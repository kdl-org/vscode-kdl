import path = require("node:path");
import { workspace, ExtensionContext, window } from "vscode";
import { getPackage } from "kdl-lsp/binary";
import { configureProxy } from "axios-proxy-builder";

import {
  DiagnosticPullMode,
  Executable,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
  const traceOutputChannel = window.createOutputChannel("KDL LSP Client");
  const config = workspace.getConfiguration("kdl");
  let command = process.env.SERVER_PATH || config.get<string>("command");
  const args = config.get<string[]>("argv", []);
  if (!command) {
    const pkg = getPackage();
    if (!pkg.exists()) {
      const proxy = configureProxy(pkg.url);
      await pkg.install(proxy, false);
    }
    const binRelPath = pkg.binaries["kdl-lsp"];
    command = path.join(pkg.installDirectory, binRelPath);
  }
  const run: Executable = {
    command,
    args,
    options: {
      env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        RUST_LOG: config.get<string>("loglevel", "debug"),
      },
    },
  };
  const serverOptions: ServerOptions = {
    run,
    debug: run,
  };
  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "kdl" }],
    outputChannel: window.createOutputChannel("KDL LSP Server"),
    traceOutputChannel,
    diagnosticPullOptions: {
      onChange: true,
      onSave: true,
      onTabs: false,
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "kdl-lsp",
    "KDL Language Server",
    serverOptions,
    clientOptions
  );
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
