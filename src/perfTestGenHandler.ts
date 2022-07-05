/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
import * as path from "path";
import * as theia from "@theia/plugin";
import { Item, quickPickOpenApiDescriptorFileItem } from "./quickPickFile";
import { quickPickWorkspaceFolder } from "./quickPickWorkspaceFolder";
import { quickInputFolder } from "./quickInputFolder";
import { OperationCanceledError } from "./Errors";

export async function generatePerformanceTests(this: any, descriptorFileUri: theia.Uri | undefined): Promise<void> {
    try {
        let rootFolder: theia.WorkspaceFolder;
        if (descriptorFileUri) {
            rootFolder = theia.workspace.getWorkspaceFolder(descriptorFileUri);
        }

        rootFolder = rootFolder || await quickPickWorkspaceFolder('To generate tests you must first open a folder or workspace.');

        const descriptorFileItem = await quickPickOpenApiDescriptorFileItem(descriptorFileUri, rootFolder);

        var destFolder = await theia.window.showInputBox({
            prompt: "Enter a destination folder for the generated script",
            ignoreFocusOut: true,
            value: path.join(rootFolder.name, "src", "perfTests")
        });
        destFolder = path.relative(rootFolder.name, destFolder);

        await executeAsTask(descriptorFileItem, destFolder, rootFolder);
        await theia.window.showTextDocument(theia.Uri.parse(path.join(rootFolder.uri.fsPath, destFolder, "script.js")));
        theia.window.showInformationMessage("Completed successfully!")
    } catch (error) {
        if (error instanceof OperationCanceledError) {
            theia.window.showErrorMessage(error.message);
        } else {
            theia.window.showErrorMessage(`Error: ${(error as Error).message}`);
        }
        throw error;
    }
}

function composeTerminalCommandArgs(descriptorFileItem: Item, destFolder: string): (string | theia.ShellQuotedString)[] {
    var args: (string | theia.ShellQuotedString)[] = [];
    args.push("@openapitools/openapi-generator-cli");
    args.push("generate");
    args.push("-i");
    args.push({ value: descriptorFileItem.absoluteFilePath, quoting: theia.ShellQuoting.Escape });
    args.push("-g");
    args.push("k6");
    args.push("-o");
    args.push({ value: destFolder.toString(), quoting: theia.ShellQuoting.Escape });
    return args;
}

function createTask(command: string, args: (string | theia.ShellQuotedString)[], workspaceFolder?: theia.WorkspaceFolder): theia.Task {
    let newEnv: NodeJS.ProcessEnv | undefined;

    return new theia.Task(
        { type: 'shell' },
        workspaceFolder ?? theia.TaskScope.Workspace,
        'Generate Performance Tests',
        '***********************SMARTCLIDE****************************',
        new theia.ShellExecution(command, args, { cwd: workspaceFolder?.uri?.fsPath, env: newEnv }),
        [] // problemMatchers
    );
}

async function executeAsTask(descriptorFileItem: Item, destFolder: string, workspaceFolder?: theia.WorkspaceFolder): Promise<void> {
    const task = createTask("npx", composeTerminalCommandArgs(descriptorFileItem, destFolder), workspaceFolder);

    const taskExecution = await theia.tasks.executeTask(task);

    const taskEndPromise = new Promise<void>((resolve, reject) => {
        const disposable = theia.tasks.onDidEndTaskProcess(e => {
            if (e.execution === taskExecution) {
                disposable.dispose();

                if (e.exitCode) {
                    reject(e.exitCode);
                }

                resolve();
            }
        });
    });

    return taskEndPromise;
}
