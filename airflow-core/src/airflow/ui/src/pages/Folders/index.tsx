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
import { Box, Button, HStack } from "@chakra-ui/react";
import { createListCollection } from "@chakra-ui/react/collection";
import { useState } from "react";
import { FiPlusCircle } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";

import { SearchBar } from "src/components/SearchBar";
import { Select } from "src/components/ui";
import type { SearchParamsKeysType } from "src/constants/searchParams";
import { SearchParamsKeys } from "src/constants/searchParams";

import FolderCard from "./FolderCard";

// 基於真實 DAG 文件的模擬數據
const mockFolders = [
  {
    dagCount: 6,
    description: "Tutorial and learning Dags for getting started with Airflow",
    id: "1",
    name: "Tutorials",
  },
  {
    dagCount: 7,
    description: "Advanced example Dags showcasing complex workflows and patterns",
    id: "2",
    name: "Advanced Examples",
  },
  {
    dagCount: 7,
    description: "Dags demonstrating asset management and data lineage features",
    id: "3",
    name: "Asset Management",
  },
  {
    dagCount: 5,
    description: "Dags showing branching logic and conditional execution",
    id: "4",
    name: "Branching & Control Flow",
  },
  {
    dagCount: 5,
    description: "Dags demonstrating parameter handling and dynamic task generation",
    id: "5",
    name: "Parameters & Dynamic Tasks",
  },
  {
    dagCount: 3,
    description: "Dags for testing deferred and asynchronous task execution",
    id: "6",
    name: "Testing & Deferred Tasks",
  },
];

const folderSortOptions = createListCollection({
  items: [
    { label: "Name (A-Z)", value: "name" },
    { label: "Name (Z-A)", value: "-name" },
    { label: "DAG Count (High-Low)", value: "-dagCount" },
    { label: "DAG Count (Low-High)", value: "dagCount" },
  ],
});

export const Folders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { NAME_PATTERN: NAME_PATTERN_PARAM }: SearchParamsKeysType = SearchParamsKeys;
  const [folderNamePattern, setFolderNamePattern] = useState(
    searchParams.get(NAME_PATTERN_PARAM) ?? undefined,
  );
  const [sortBy, setSortBy] = useState("name");

  // 模擬數據過濾和排序
  const filteredFolders = mockFolders
    .filter(
      (folder) =>
        folderNamePattern === undefined ||
        folderNamePattern === "" ||
        folder.name.toLowerCase().includes(folderNamePattern.toLowerCase()) ||
        folder.description.toLowerCase().includes(folderNamePattern.toLowerCase()),
    )
    .sort((folderA, folderB) => {
      if (sortBy === "name") {
        return folderA.name.localeCompare(folderB.name);
      }
      if (sortBy === "-name") {
        return folderB.name.localeCompare(folderA.name);
      }
      if (sortBy === "dagCount") {
        return folderA.dagCount - folderB.dagCount;
      }
      if (sortBy === "-dagCount") {
        return folderB.dagCount - folderA.dagCount;
      }

      return 0;
    });

  const handleSearchChange = (value: string) => {
    if (value) {
      searchParams.set(NAME_PATTERN_PARAM, value);
    } else {
      searchParams.delete(NAME_PATTERN_PARAM);
    }
    setSearchParams(searchParams);
    setFolderNamePattern(value);
  };

  const handleSortChange = (details: { value: Array<string> }) => {
    const [firstValue] = details.value;

    if (firstValue !== undefined && firstValue !== "") {
      setSortBy(firstValue);
    }
  };

  return (
    <>
      <SearchBar
        buttonProps={{ disabled: true }}
        defaultValue={folderNamePattern ?? ""}
        onChange={handleSearchChange}
        placeHolder="Search Folders"
      />
      <HStack gap={4} mt={4}>
        <Select.Root
          borderWidth={0}
          collection={folderSortOptions}
          defaultValue={["name"]}
          onValueChange={handleSortChange}
          width={200}
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Sort by" />
          </Select.Trigger>

          <Select.Content>
            {folderSortOptions.items.map((option) => (
              <Select.Item item={option} key={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        {/* <Button colorScheme="blue">
          <FiPlusCircle /> Add Folder
        </Button> */}
        <Button colorPalette="blue">
          <FiPlusCircle /> Add Folder
        </Button>
      </HStack>
      <Box display="grid" gap={4} gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" mt={4}>
        {filteredFolders.map((folder) => (
          <FolderCard folder={folder} key={folder.id} />
        ))}
      </Box>
    </>
  );
};
