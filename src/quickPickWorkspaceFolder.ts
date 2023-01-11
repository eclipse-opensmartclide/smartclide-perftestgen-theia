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
import { Disposable, QuickPick, window } from 'vscode';
import { OperationCanceledError } from './Errors';

export interface Item extends vscode.QuickPickItem {
    actualFolder: vscode.WorkspaceFolder;
}

export interface IPickMetadata {
    title: string;
    placeholder: string;
    items: Item[];
}

export async function quickPickWorkspaceFolder(noWorkspacesMessage: string): Promise<vscode.WorkspaceFolder> {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
        return vscode.workspace.workspaceFolders[0];
    } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
        const items: Item[] = [];
        vscode.workspace.workspaceFolders.forEach(wsFolder => {
            items.push(<Item>{
                label: wsFolder.name,
                actualFolder: wsFolder
            });
        });
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
        throw new Error(noWorkspacesMessage);
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
