import * as theia from '@theia/plugin';
import { Disposable, QuickPick, window } from "@theia/plugin";
import { OperationCanceledError } from './Errors';

export interface Item extends theia.QuickPickItem {
    actualFolder: theia.WorkspaceFolder;
}

export interface IPickMetadata {
    title: string;
    placeholder: string;
    items: Item[];
}

export async function quickPickWorkspaceFolder(noWorkspacesMessage: string): Promise<theia.WorkspaceFolder> {
    if (theia.workspace.workspaceFolders && theia.workspace.workspaceFolders.length === 1) {
        return theia.workspace.workspaceFolders[0];
    } else if (theia.workspace.workspaceFolders && theia.workspace.workspaceFolders.length > 1) {
        const items: Item[] = [];
        theia.workspace.workspaceFolders.forEach(wsFolder => {
            items.push(<Item>{
                label: wsFolder.name,
                actualFolder: wsFolder
            })
        })
        const fileItem: Item = await quickPickFileItem({
            title: "Root folder",
            placeholder: "Select a folder/project to work with:",
            items: items
        });

        if (!fileItem) {
            throw new Error('No item was selected');
        }
        return fileItem.actualFolder;
    } else {
        throw new Error("Unexpected workspace status");
    }
}

export async function quickPickFileItem(pickMetadata: IPickMetadata): Promise<Item> {
    const disposables: Disposable[] = [];
    const result: Item = await new Promise<Item>((resolve, reject) => {
        const pickBox: QuickPick<Item> = window.createQuickPick<Item>();
        pickBox.title = pickMetadata.title;
        pickBox.placeholder = pickMetadata.placeholder;
        pickBox.items = pickMetadata.items;
        pickBox.ignoreFocusOut = true;

        disposables.push(
            pickBox.onDidAccept(() => {
                if (!pickBox.selectedItems[0]) {
                    return;
                }
                return resolve(pickBox.selectedItems[0]);
            }),
            pickBox.onDidHide(() => {
                return reject(new OperationCanceledError("No file selected"));
            })
        );
        disposables.push(pickBox);
        pickBox.show();
    });
    for (const d of disposables) {
        d.dispose();
    }
    return result;
}
