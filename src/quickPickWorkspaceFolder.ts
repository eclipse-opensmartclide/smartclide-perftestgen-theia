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
