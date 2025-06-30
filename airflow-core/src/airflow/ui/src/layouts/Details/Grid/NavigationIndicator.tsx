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
import { Badge, Box, Flex, Text } from "@chakra-ui/react";

type NavigationMode = "task" | "run" | "grid";

interface NavigationIndicatorProps {
  mode: NavigationMode;
  isPreviewMode: boolean;
  currentTaskIndex: number;
  currentRunIndex: number;
  totalTasks: number;
  totalRuns: number;
}

export const NavigationIndicator = ({
  mode,
  isPreviewMode,
  currentTaskIndex,
  currentRunIndex,
  totalTasks,
  totalRuns,
}: NavigationIndicatorProps) => {
  const modeLabels = {
    grid: "Grid",
    task: "Task Rows",
    run: "Run Columns",
  };

  const modeDescriptions = {
    grid: "Navigate in all directions",
    task: "Navigate up/down through tasks",
    run: "Navigate left/right through runs",
  };

  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      bg="gray.900"
      color="white"
      p={3}
      borderRadius="md"
      boxShadow="lg"
      zIndex={1000}
      opacity={0.9}
      fontSize="sm"
    >
      <Flex alignItems="center" gap={2} mb={1}>
        <Badge colorPalette={isPreviewMode ? "yellow" : "blue"} size="sm">
          {isPreviewMode ? "Preview" : "Navigate"}
        </Badge>
        <Badge colorPalette="gray" size="sm">
          {modeLabels[mode]}
        </Badge>
      </Flex>
      
      <Text fontSize="xs" mb={1}>
        {modeDescriptions[mode]}
      </Text>
      
      <Text fontSize="xs" color="gray.400">
        Position: Task {currentTaskIndex + 1}/{totalTasks}, Run {currentRunIndex + 1}/{totalRuns}
      </Text>
      
      <Text fontSize="xs" color="gray.500" mt={1}>
        Space: Switch mode • Long press: Preview • Cmd+Arrow: Jump to edge
      </Text>
    </Box>
  );
};