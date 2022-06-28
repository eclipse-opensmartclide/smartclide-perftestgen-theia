/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
// GLOB Patterns
export const FROM_DIRECTIVE_PATTERN = /^\s*FROM\s*([\w-/:]*)(\s*AS\s*[a-z][a-z0-9-_\\.]*)?$/i;
export const YAML_GLOB_PATTERN = '**/*.{[yY][aA][mM][lL],[yY][mM][lL]}';
export const JSON_GLOB_PATTERN = '**/*.{[jJ][sS][oO][nN]}';
export const JS_GLOB_PATTERN = '**/*.{[jJ][sS]}';
export const GITLABCI_GLOB_PATTERN = '**/.gitlab-ci.{[yY][aA][mM][lL],[yY][mM][lL]}';

export const EXCLUDE_GLOB_PATTERN = '{**,.*}/{theia,.*,**}/{.*,*.ts*,ts*,package*,settings,launch,lerna}.{json,yaml,yml}';
export const EXCLUDE_GLOB_PATTERN2 = '**/{.*,node_modules*,lib}/}{**,.*}';


// File search max ammout
export const FILE_SEARCH_MAX_RESULT = 100;

export const YES = "Yes";
export const CANCEL = "Cancel";
