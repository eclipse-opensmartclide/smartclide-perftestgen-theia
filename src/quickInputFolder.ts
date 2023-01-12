/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
import { Disposable, InputBox, window } from 'vscode';
import { OperationCanceledError } from "./Errors";

export async function quickInputFolder(inputMetaData: IInputMetaData): Promise<string> {
    const disposables: Disposable[] = [];
    const result: string = await new Promise<string>((resolve, reject) => {
        const inputBox: InputBox = window.createInputBox();
        inputBox.title = inputMetaData.title;
        inputBox.placeholder = inputMetaData.placeholder;
        inputBox.prompt = inputMetaData.prompt;
        inputBox.value = inputMetaData.defaultValue;
        inputBox.ignoreFocusOut = true;

        disposables.push(
            inputBox.onDidAccept(() => {
                if (inputBox.value.length > 0) {
                    return resolve(inputBox.value);
                }
                return reject(new OperationCanceledError("Invalid input"));
            }),
            inputBox.onDidHide(() => {
                return reject(new OperationCanceledError("No destination folder selected"));
            })
        );
        disposables.push(inputBox);
        inputBox.show();
    });
    for (const d of disposables) {
        d.dispose();
    }
    //hack to ensure input box disappears
    // const inputBox: InputBox = window.createInputBox();
    // inputBox.show();
    // inputBox.hide();
    // inputBox.dispose();
    return result;
}

export interface IInputMetaData {
    title?: string;
    placeholder?: string;
    prompt?: string;
    defaultValue?: string;
    stepCancelledMsg?: string;
    validate?(inputFieldValue: string): string | null;
}
