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
import { Box, Button, HStack, IconButton } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";

import { NumberInputField, NumberInputRoot } from "src/components/ui/NumberInput";

import type { FilterPluginProps } from "../types";

export const NumberFilter = ({ filter, onChange, onRemove }: FilterPluginProps) => {
  const [isEditing, setIsEditing] = useState(() => {
    const { value } = filter;

    return value === null || value === undefined || value === "";
  });

  const handlePillClick = () => {
    setIsEditing(true);
  };

  const handleValueChange = (details: { value: string }) => {
    const numValue = details.value === "" ? null : Number(details.value);

    onChange(numValue);
    // 不要在值改變時立即退出編輯模式，讓用戶繼續編輯
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      setIsEditing(false);
    } else if (event.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleBlur = (event: React.FocusEvent) => {
    // 延遲處理 blur，檢查焦點是否真的離開了數字輸入組件
    setTimeout(() => {
      const { activeElement } = document;
      const { currentTarget } = event;

      // 如果焦點還在 NumberInput 相關元素內，不要退出編輯模式
      if (activeElement && currentTarget.contains(activeElement)) {
        return;
      }

      setIsEditing(false);
    }, 50);
  };

  useEffect(() => {
    const { value } = filter;
    const isEmpty = value === null || value === undefined || value === "";

    if (isEmpty && !isEditing) {
      setIsEditing(true);
    }
  }, [filter, isEditing]);

  if (isEditing) {
    return (
      <NumberInputRoot
        borderRadius="full"
        max={filter.config.max}
        min={filter.config.min ?? 0}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onValueChange={handleValueChange}
        overflow="hidden"
        value={filter.value?.toString() ?? ""}
        width="180px"
      >
        <NumberInputField
          borderRadius="full"
          placeholder={filter.config.placeholder ?? `Enter ${filter.config.label.toLowerCase()}`}
        />
      </NumberInputRoot>
    );
  }

  const hasValue = filter.value !== null && filter.value !== undefined && filter.value !== "";

  return (
    <Button
      _hover={{ bg: "colorPalette.subtle" }}
      bg={hasValue ? "blue.muted" : "gray.muted"}
      borderRadius="full"
      color="colorPalette.fg"
      colorPalette={hasValue ? "blue" : "gray"}
      cursor="pointer"
      onClick={handlePillClick}
      size="sm"
    >
      <HStack align="center" gap={0}>
        <Box flex="1" fontSize="sm" fontWeight="medium" px={3} py={2}>
          {filter.config.label}: {hasValue ? String(filter.value) : ""}
        </Box>

        <IconButton
          _hover={{
            bg: "red.100",
            color: "red.600",
          }}
          aria-label={`Remove ${filter.config.label} filter`}
          bg="transparent"
          color="gray.400"
          mr={1}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          rounded="full"
          size="xs"
          transition="all 0.2s"
          variant="ghost"
        >
          <MdClose size={12} />
        </IconButton>
      </HStack>
    </Button>
  );
};
