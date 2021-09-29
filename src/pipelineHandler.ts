import { OperationCanceledError } from './Errors';
import * as theia from "@theia/plugin";
import * as  yaml from "js-yaml";
import { quickPickPipelineFileItem, quickPickTestFileItem } from "./quickPickFile";
import { quickPickWorkspaceFolder } from './quickPickWorkspaceFolder';

export async function addPerformanceTestsToPipeline(gitlabFileUri: theia.Uri | undefined, scriptFileUri: theia.Uri | undefined): Promise<void> {
    try {
        let rootFolder: theia.WorkspaceFolder;
        if (gitlabFileUri) {
            rootFolder = theia.workspace.getWorkspaceFolder(gitlabFileUri);
        }

        rootFolder = rootFolder || await quickPickWorkspaceFolder('To generate tests you must first open a folder or workspace.');

        // let fileUri = await selectGitlabFile(gitlabFileUri);
        let fileItem = await quickPickPipelineFileItem(gitlabFileUri, rootFolder);
        const fileUri = theia.Uri.file(fileItem.absoluteFilePath);

        // let testFileRelativePath = await selectTestScriptFile(scriptFileUri);
        let testScriptFileItem = await quickPickTestFileItem(scriptFileUri, rootFolder);

        // await updatePipeline(fileItem.uri, testFileRelativePath);
        await updatePipeline(fileUri, testScriptFileItem.relativeFilePath);

        theia.window.showTextDocument(fileUri);
        theia.window.showInformationMessage("Testing stage added to pipeline");
    } catch (error) {
        theia.window.showErrorMessage(`Error: ${(error as Error).message}\n${(error as Error).stack}`);
    }
}
async function selectGitlabFile(gitlabFileUri: theia.Uri | undefined): Promise<theia.Uri> {
    let fileUris = await theia.window.showOpenDialog({
        title: "Gitlab CI file", canSelectMany: false, filters: { 'GitLab CI File': ['yml', 'yaml'] },
        defaultUri: theia.workspace.workspaceFolders[0].uri
    });
    if (!fileUris || fileUris.length < 1) {
        throw new OperationCanceledError("No file selected");
    }
    return fileUris[0];
}

async function selectTestScriptFile(scriptFileUri: theia.Uri | undefined): Promise<string> {
    let testFileUri = (scriptFileUri) ? scriptFileUri : await theia.window.showOpenDialog({
        title: "Test script file to be included", canSelectMany: false, filters: { 'Test Script File': ['js'] },
        defaultUri: theia.workspace.workspaceFolders[0].uri
    }).then(uris => uris[0]);
    if (!testFileUri) {
        throw new OperationCanceledError("No test file selected");
    }

    return theia.workspace.asRelativePath(testFileUri);
}

async function updatePipeline(gitlabFileUri: theia.Uri, testFilePath: string): Promise<void> {
    var fileContent = await theia.workspace.fs.readFile(gitlabFileUri);
    let fileContentAsString = new TextDecoder().decode(fileContent);
    var file = yaml.load(fileContentAsString);


    if (file['stages'] && file['stages'].indexOf('load_performance') === -1) {
        file['stages'].push('load_performance');
    }
    /*
        const PERFORMANCE_TEMPLATE_DEFINITION = { "template": "Verify/Load-Performance-Testing.gitlab-ci.yml" };
        if (!file["include"]) {
            file["include"] = PERFORMANCE_TEMPLATE_DEFINITION;
        } else {
            if (Array.isArray(file["include"])) {
                file["include"].push(PERFORMANCE_TEMPLATE_DEFINITION);
            } else if (file["include"] instanceof String) {
                let includeString = file["include"];
                delete file["include"];
                file["include"] = [
                    { "local": includeString },
                    PERFORMANCE_TEMPLATE_DEFINITION
                ];
            } else if (file["include"] instanceof Object) {
                let currentIncludeObject = file["include"];
                delete file["include"];
                file["include"] = [
                    currentIncludeObject,
                    PERFORMANCE_TEMPLATE_DEFINITION
                ];
            }
        }
        file["load_performance"] = {
            "stage": "load_performance",
            "variables": {
                "K6_TEST_FILE": testFilePath,
                "K6_OPTIONS": "--duration 30s"
            }
        };
    */
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

    await theia.workspace.fs.writeFile(gitlabFileUri, new TextEncoder().encode(yaml.dump(file)));
}