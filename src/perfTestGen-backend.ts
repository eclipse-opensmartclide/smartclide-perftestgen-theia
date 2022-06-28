/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
import * as theia from '@theia/plugin';
import { generatePerformanceTests } from './perfTestGenHandler';
import { addPerformanceTestsToPipeline } from './pipelineHandler';

export function start(context: theia.PluginContext) {
    const generateTestsCommand = {
        id: 'perf-tests-generate-command',
        label: "SmartCLIDE: Generate performance test script..."
    };
    context.subscriptions.push(theia.commands.registerCommand(generateTestsCommand, (...args: any[]) => {
        generatePerformanceTests(undefined);
    }));
    context.subscriptions.push(theia.commands.registerCommand(
        { id: 'perf-tests-pipeline-command', label: 'SmartCLIDE: Add performance tests to pipeline...' },
        () => { addPerformanceTestsToPipeline(undefined, undefined); }));
}


export function stop() {

}
