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
