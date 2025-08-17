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
import { Box, Button, HStack, IconButton, Input } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { MdClose } from "react-icons/md";
import { useDebouncedCallback } from "use-debounce";

import type { FilterPluginProps } from "../types";

const debounceDelay = 200;

export const TextSearchFilter = ({ filter, onChange, onRemove }: FilterPluginProps) => {
  const [isEditing, setIsEditing] = useState(String(filter.value ?? "") === "");
  const [inputValue, setInputValue] = useState(String(filter.value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange(value);
  }, debounceDelay);

  const handlePillClick = () => {
    setIsEditing(true);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      setIsEditing(false);
      onChange(inputValue);
    } else if (event.key === "Escape") {
      setInputValue(String(filter.value ?? ""));
      setIsEditing(false);
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    onChange(inputValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    setInputValue(newValue);
    debouncedOnChange(newValue);
  };

  useHotkeys(
    "mod+k",
    () => {
      if (!filter.config.hotkeyDisabled) {
        inputRef.current?.focus();
      }
    },
    { enabled: !filter.config.hotkeyDisabled, preventDefault: true },
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setInputValue(String(filter.value ?? ""));
  }, [filter.value]);

  if (isEditing) {
    return (
      <Input
        borderRadius="full"
        onBlur={handleInputBlur}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={filter.config.placeholder ?? `Enter ${filter.config.label.toLowerCase()}`}
        ref={inputRef}
        size="sm"
        value={inputValue}
        width="220px"
      />
    );
  }

  const hasValue = filter.value !== null && filter.value !== undefined && String(filter.value).trim() !== "";

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
