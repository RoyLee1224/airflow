/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import type { GridDAGRunwithTIs, NodeResponse } from "openapi/requests/types.gen";

export type RunWithDuration = {
  duration: number;
} & GridDAGRunwithTIs;

export type GridTask = {
  depth: number;
  firstChildIndex?: number;
  isFirstChildOfParent?: boolean;
  isGroup?: boolean;
  isOpen?: boolean;
  parentId?: string;
} & NodeResponse;

export const flattenNodes = (nodes: Array<NodeResponse>, openGroupIds: Array<string>, depth: number = 0) => {
  const flatNodes: Array<GridTask> = [];
  const allGroupIds: Array<string> = [];

  const processNode = (node: NodeResponse, currentDepth: number, parentId?: string) => {
    if (node.type !== "task") {
      return;
    }

    if (node.children) {
      const isOpen = openGroupIds.includes(node.id);
      const groupIndex = flatNodes.length;
      
      flatNodes.push({ 
        ...node, 
        depth: currentDepth, 
        isGroup: true, 
        isOpen,
        parentId,
      });
      allGroupIds.push(node.id);

      if (!isOpen || node.children.length === 0) {
        return;
      }

      const firstChildWillBeAtIndex = flatNodes.length;
      
      // Process all children
      node.children.forEach((child) => {
        processNode(child, currentDepth + 1, node.id);
      });
      
      // Update group's firstChildIndex and mark first child
      if (flatNodes.length > firstChildWillBeAtIndex) {
        const groupNode = flatNodes[groupIndex];
        const firstChild = flatNodes[firstChildWillBeAtIndex];
        
        if (groupNode) {
          groupNode.firstChildIndex = firstChildWillBeAtIndex;
        }
        if (firstChild) {
          firstChild.isFirstChildOfParent = true;
        }
      }
      
      return;
    }

    // Process regular task nodes
    flatNodes.push({ 
      ...node, 
      depth: currentDepth,
      parentId,
    });
  };

  nodes.forEach(node => processNode(node, depth));

  return { allGroupIds, flatNodes };
};
