/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
import * as vscode from 'vscode';
import { generatePerformanceTests } from './perfTestGenHandler';
import { addPerformanceTestsToPipeline } from './pipelineHandler';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "sample" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand("perf-tests-generate-command", (...args: any[]) => {
        generatePerformanceTests(undefined);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("perf-tests-pipeline-command",
        () => { addPerformanceTestsToPipeline(undefined, undefined); }));
}

export function deactivate() {}
