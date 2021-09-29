import * as theia from '@theia/plugin';
import { OperationCanceledError } from './Errors';

export async function quickPickWorkspaceFolder(noWorkspacesMessage: string): Promise<theia.WorkspaceFolder> {
    if (theia.workspace.workspaceFolders && theia.workspace.workspaceFolders.length === 1) {
        return theia.workspace.workspaceFolders[0];
    } else if (theia.workspace.workspaceFolders && theia.workspace.workspaceFolders.length > 1) {
        const selected = await theia.window.showWorkspaceFolderPick();
        if (!selected) {
            throw new OperationCanceledError(noWorkspacesMessage);
        }
        return selected;
    } else {
        throw new Error(noWorkspacesMessage);
    }
}