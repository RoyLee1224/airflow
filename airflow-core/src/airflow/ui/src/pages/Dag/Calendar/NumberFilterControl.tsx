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
import { HStack, Text, Input, createListCollection, type SelectValueChangeDetails, Button } from "@chakra-ui/react";
import { FiFilter } from "react-icons/fi";

import { Select } from "src/components/ui";

export type FilterOperator = "<" | "=" | ">";

type Props = {
  readonly filterEnabled: boolean;
  readonly filterOperator: FilterOperator;
  readonly numberFilter: number;
  readonly onFilterChange: (value: number) => void;
  readonly onFilterEnabledChange: (enabled: boolean) => void;
  readonly onOperatorChange: (operator: FilterOperator) => void;
  readonly showNumbers: boolean;
};

export const NumberFilterControl = ({
  filterEnabled,
  filterOperator,
  numberFilter,
  onFilterChange,
  onFilterEnabledChange,
  onOperatorChange,
  showNumbers
}: Props) => {

  const operatorOptions = createListCollection({
    items: [
      { label: ">", value: ">" },
      { label: "=", value: "=" },
      { label: "<", value: "<" },
    ],
  });

  const handleOperatorChange = ({ value }: SelectValueChangeDetails<Array<string>>) => {
    if (value.length > 0) {
      onOperatorChange(value[0] as FilterOperator);
    }
  };

  return (
    <HStack align="center" gap={2}>
      <Button
        colorPalette="blue"
        onClick={() => onFilterEnabledChange(!filterEnabled)}
        size="sm"
        variant={filterEnabled ? "solid" : "outline"}
      >
        <HStack gap={1}>
          <FiFilter />
          <Text>Filter</Text>
        </HStack>
      </Button>

      {filterEnabled ? <HStack align="center" gap={1}>
          <Select.Root
            collection={operatorOptions}
            onValueChange={handleOperatorChange}
            size="sm"
            value={[filterOperator]}
            width="50px"
          >
            <Select.Trigger>
              <Select.ValueText />
            </Select.Trigger>
            <Select.Content>
              {operatorOptions.items.map((option) => (
                <Select.Item item={option} key={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Input
            max={999}
            min={0}
            onChange={(event) => onFilterChange(Math.max(0, parseInt(event.target.value, 10) || 0))}
            size="sm"
            textAlign="center"
            type="number"
            value={numberFilter}
            width="60px"
          />
        </HStack> : null}
    </HStack>
  );
};
