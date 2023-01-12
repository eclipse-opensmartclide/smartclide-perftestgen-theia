/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
import { OperationCanceledError } from './Errors';
import * as vscode from 'vscode';
import * as  yaml from "js-yaml";
import { quickPickPipelineFileItem, quickPickTestFileItem } from "./quickPickFile";
import { quickPickWorkspaceFolder } from './quickPickWorkspaceFolder';
import * as fs from 'fs';

export async function addPerformanceTestsToPipeline(gitlabFileUri: vscode.Uri | undefined, scriptFileUri: vscode.Uri | undefined): Promise<void> {
    try {
        var rootFolder;
        if (gitlabFileUri) {
            rootFolder = vscode.workspace.getWorkspaceFolder(gitlabFileUri);
        }

        rootFolder = rootFolder || await quickPickWorkspaceFolder('To generate tests you must first open a folder or workspace.');

        let fileItem = await quickPickPipelineFileItem(gitlabFileUri, rootFolder);
        const fileUri = vscode.Uri.file(fileItem.absoluteFilePath);

        let testScriptFileItem = await quickPickTestFileItem(scriptFileUri, rootFolder);

        await updatePipeline(fileUri, testScriptFileItem.relativeFilePath);

        vscode.window.showTextDocument(fileUri);
        vscode.window.showInformationMessage("Testing stage added to pipeline");
    } catch (error) {
        vscode.window.showErrorMessage(`Error: ${(error as Error).message}\n${(error as Error).stack}`);
    }
}
async function selectGitlabFile(gitlabFileUri: vscode.Uri | undefined): Promise<vscode.Uri> {
    let fileUris = await vscode.window.showOpenDialog({
        title: "Gitlab CI file", canSelectMany: false, filters: { 'GitLab CI File': ['yml', 'yaml'] }
    });
    if (!fileUris || fileUris.length < 1) {
        throw new OperationCanceledError("No file selected");
    }
    return fileUris[0];
}

async function selectTestScriptFile(scriptFileUri: vscode.Uri | undefined): Promise<string> {
    let testFileUri = (scriptFileUri) ? scriptFileUri : await vscode.window.showOpenDialog({
        title: "Test script file to be included", canSelectMany: false, filters: { 'Test Script File': ['js'] }
    }).then(uris => {if(uris) {return uris[0];}});
    if (!testFileUri) {
        throw new OperationCanceledError("No test file selected");
    }

    return vscode.workspace.asRelativePath(testFileUri);
}

async function updatePipeline(gitlabFileUri: vscode.Uri, testFilePath: string): Promise<void> {
    let fileContentAsString = fs.readFileSync(gitlabFileUri.fsPath, "utf-8");
    var file = yaml.load(fileContentAsString);


    if (file['stages'] && file['stages'].indexOf('load_performance') === -1) {
        file['stages'].push('load_performance');
    }
    file["load_performance"] = {
        "stage": "load_performance",
        "image": {
            "name": "loadimpact/k6:latest",
        },
        "variables": {
            "K6_TEST_FILE": testFilePath
        },
        "script": [
            "echo \"executing local k6 in k6 container...\"",
            "k6 run ./$K6_TEST_FILE --summary-export=load-performance.json"
        ],
        "artifacts": {
            "reports": {
                "load_performance": "load-performance.json"
            }
        }
    };

    fs.writeFileSync(gitlabFileUri.fsPath, yaml.dump(file));
}
