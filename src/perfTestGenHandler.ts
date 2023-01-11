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
import * as vscode from 'vscode';
import { Item, quickPickOpenApiDescriptorFileItem } from "./quickPickFile";
import { quickPickWorkspaceFolder } from "./quickPickWorkspaceFolder";
import { quickInputFolder } from "./quickInputFolder";
import { OperationCanceledError } from "./Errors";
import * as FormData from "form-data";
import fetch from 'node-fetch';
import * as fs from 'fs';

export async function generatePerformanceTests(this: any, descriptorFileUri: vscode.Uri | undefined): Promise<void> {
    try {
        var rootFolder;
        if (descriptorFileUri) {
            rootFolder = vscode.workspace.getWorkspaceFolder(descriptorFileUri);
        }

        rootFolder = rootFolder || await quickPickWorkspaceFolder('To generate tests you must first open a folder or workspace.');

        const descriptorFileItem = await quickPickOpenApiDescriptorFileItem(descriptorFileUri, rootFolder);

        var destFolder = await vscode.window.showInputBox({
            prompt: "Enter a destination folder for the generated script",
            ignoreFocusOut: true,
            value: path.join(rootFolder.uri.fsPath, "src", "perfTests")
        });
        if(destFolder === undefined){
            throw new OperationCanceledError("No destination folder provided");
        }

        let outputFile = await generateTestScript(descriptorFileItem.absoluteFilePath, destFolder);
        await vscode.window.showTextDocument(outputFile);
        vscode.window.showInformationMessage("Test generation completed successfully!");
    } catch (error) {
        if (error instanceof OperationCanceledError) {
            vscode.window.showErrorMessage(error.message);
        } else if (error instanceof Error) {
            vscode.window.showErrorMessage(`Error: ${(error as Error).message}`);
        } else {
            vscode.window.showErrorMessage("Error: " + String(error));
        }
    }
}

async function generateTestScript(descriptorFilePath: string, destinationFolderPath: string): Promise<vscode.Uri> {
    var scriptGenerationService = vscode.workspace.getConfiguration("smartclide.performanceTestGenerator").get<string>("url", "localhost:8080/perftest");

    var outputFile = vscode.Uri.file(path.resolve(destinationFolderPath, "performance_test.js"));

    vscode.window.showInformationMessage("Generating request data form!");
    var myForm = new FormData();
    myForm.append("file", fs.createReadStream(descriptorFilePath));
    await fetch(scriptGenerationService, {
        method: 'post',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Accept': '*/*',
        },
        body: myForm
    })
        .then(res => {
            if (!res.ok) {
                throw Error("HTTP request returned status " + res.status + " - " + res.statusText);
            }
            return res;
        })
        .then(res => {
            vscode.window.showInformationMessage("Storing response on " + path.resolve(destinationFolderPath));
            fs.mkdirSync(path.resolve(destinationFolderPath), { recursive: true });
            fs.createWriteStream(outputFile.fsPath).write(res?.body?.read());
        });

    return outputFile;
}