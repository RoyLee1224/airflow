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
import {
  Badge,
  Box,
  Button,
  createListCollection,
  HStack,
  Input,
  Text,
  VStack,
  type SelectValueChangeDetails,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCalendar, LuCode, LuDatabase, LuKey, LuPlus, LuX } from "react-icons/lu";

import { Menu, Select } from "src/components/ui";

export interface XComFilter {
  id: string;
  field: "key" | "dag_id" | "task_id" | "run_id" | "logical_date" | "run_after" | "value";
  operator: "contains" | "equals" | "starts_with" | "ends_with" | "date_range";
  value: string | [string, string];
}

interface XComFiltersProps {
  filters: XComFilter[];
  onFiltersChange: (filters: XComFilter[]) => void;
}

interface FilterOption {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}

interface OperatorOption {
  label: string;
  value: string;
}

const filterOptions = createListCollection<FilterOption>({
  items: [
    { icon: LuKey, label: "XCom Key", value: "key" },
    { icon: LuCode, label: "DAG ID", value: "dag_id" },
    { icon: LuCode, label: "Task ID", value: "task_id" },
    { icon: LuCode, label: "Run ID", value: "run_id" },
    { icon: LuCalendar, label: "Logical Date", value: "logical_date" },
    { icon: LuCalendar, label: "Run After", value: "run_after" },
    { icon: LuDatabase, label: "Value Content", value: "value" },
  ],
});

const operatorOptions = createListCollection<OperatorOption>({
  items: [
    { label: "Contains", value: "contains" },
    { label: "Equals", value: "equals" },
    { label: "Starts with", value: "starts_with" },
    { label: "Ends with", value: "ends_with" },
    { label: "Date range", value: "date_range" },
  ],
});

export const XComFilters = ({ filters, onFiltersChange }: XComFiltersProps) => {
  const { t } = useTranslation(["browse", "common"]);

  const addFilter = (field: XComFilter["field"]) => {
    const newFilter: XComFilter = {
      id: Date.now().toString(),
      field,
      operator: field === "logical_date" || field === "run_after" ? "date_range" : "contains",
      value: field === "logical_date" || field === "run_after" ? ["", ""] : "",
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<XComFilter>) => {
    onFiltersChange(
      filters.map((filter) =>
        filter.id === id
          ? {
              ...filter,
              ...updates,
              // Reset value when operator changes
              ...(updates.operator && updates.operator !== filter.operator
                ? {
                    value:
                      updates.operator === "date_range" ? ["", ""] : typeof filter.value === "string" ? "" : "",
                  }
                : {}),
            }
          : filter,
      ),
    );
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((filter) => filter.id !== id));
  };

  const getFieldIcon = (field: XComFilter["field"]) => {
    const option = filterOptions.items.find((item) => item.value === field);
    return option?.icon || LuKey;
  };

  const getFieldLabel = (field: XComFilter["field"]) => {
    const option = filterOptions.items.find((item) => item.value === field);
    return option?.label || field;
  };

  const renderFilterValue = (filter: XComFilter) => {
    if (filter.operator === "date_range") {
      const [start, end] = Array.isArray(filter.value) ? filter.value : ["", ""];

      return (
        <HStack>
          <Input
            onChange={(event) => updateFilter(filter.id, { value: [event.target.value, end] })}
            placeholder={t("common:from")}
            size="sm"
            type="datetime-local"
            value={start}
            width="180px"
          />
          <Text color="fg.muted" fontSize="sm">
            {t("common:to")}
          </Text>
          <Input
            onChange={(event) => updateFilter(filter.id, { value: [start, event.target.value] })}
            placeholder={t("common:to")}
            size="sm"
            type="datetime-local"
            value={end}
            width="180px"
          />
        </HStack>
      );
    }

    return (
      <Input
        onChange={(event) => updateFilter(filter.id, { value: event.target.value })}
        placeholder={`Enter ${getFieldLabel(filter.field).toLowerCase()}...`}
        size="sm"
        value={typeof filter.value === "string" ? filter.value : ""}
        width="200px"
      />
    );
  };

  return (
    <Box mb={4}>
      <HStack mb={3}>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button size="sm" variant="outline">
              <LuPlus />
              {t("browse:xcom.filters.addFilter")}
            </Button>
          </Menu.Trigger>

          <Menu.Content>
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel>
                {t("browse:xcom.filters.filterBy")}
              </Menu.ItemGroupLabel>
              {filterOptions.items.map((option) => {
                const Icon = option.icon;
                return (
                  <Menu.Item
                    key={option.value}
                    onClick={() => addFilter(option.value as XComFilter["field"])}
                    value={option.value}
                  >
                    <Icon size={16} />
                    {option.label}
                  </Menu.Item>
                );
              })}
            </Menu.ItemGroup>
          </Menu.Content>
        </Menu.Root>

        {filters.length > 0 && (
          <Badge colorPalette="blue" size="sm">
            {filters.length} {filters.length === 1 ? t("common:filter") : t("common:filters")}
          </Badge>
        )}
      </HStack>

      <VStack align="stretch" gap={2}>
        {filters.map((filter) => {
          const Icon = getFieldIcon(filter.field);

          return (
            <HStack
              key={filter.id}
              align="center"
              bg="bg.subtle"
              borderRadius="md"
              gap={3}
              p={3}
            >
              <HStack minWidth="120px">
                <Icon size={16} />
                <Text fontSize="sm" fontWeight="medium">
                  {getFieldLabel(filter.field)}
                </Text>
              </HStack>

              <Select.Root
                collection={operatorOptions}
                onValueChange={({ value }: SelectValueChangeDetails<string>) => {
                  const [operator] = value;
                  if (operator) {
                    updateFilter(filter.id, { operator: operator as XComFilter["operator"] });
                  }
                }}
                value={[filter.operator]}
                width="140px"
              >
                <Select.Trigger size="sm">
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

              {renderFilterValue(filter)}

              <Button
                onClick={() => removeFilter(filter.id)}
                size="sm"
                variant="ghost"
              >
                <LuX size={16} />
              </Button>
            </HStack>
          );
        })}
      </VStack>

      {filters.length > 0 && (
        <HStack justify="flex-end" mt={3}>
          <Button onClick={() => onFiltersChange([])} size="sm" variant="ghost">
{t("browse:xcom.filters.clearAllFilters")}
          </Button>
        </HStack>
      )}
    </Box>
  );
};
