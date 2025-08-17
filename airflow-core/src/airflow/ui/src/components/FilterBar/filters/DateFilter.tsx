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

import { DateTimeInput } from "src/components/DateTimeInput";

import type { FilterPluginProps } from "../types";

export const DateFilter = ({ filter, onChange, onRemove }: FilterPluginProps) => {
  const [isEditing, setIsEditing] = useState(() => {
    const { value } = filter;

    return value === null || value === undefined || value === "";
  });

  const handlePillClick = () => {
    setIsEditing(true);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    onChange(value || undefined);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      setIsEditing(false);
    } else if (event.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsEditing(false);
    }, 100);
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
      <DateTimeInput
        borderRadius="full"
        onBlur={handleBlur}
        onChange={handleDateChange}
        onKeyDown={handleKeyDown}
        placeholder={filter.config.placeholder ?? `Select ${filter.config.label.toLowerCase()}`}
        size="sm"
        value={filter.value !== null && filter.value !== undefined ? String(filter.value) : ""}
        width="200px"
      />
    );
  }

  const hasValue = filter.value !== null && filter.value !== undefined && String(filter.value).trim() !== "";
  const displayValue = hasValue
    ? new Date(String(filter.value)).toLocaleString("en-US", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

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
          {filter.config.label}: {displayValue}
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
