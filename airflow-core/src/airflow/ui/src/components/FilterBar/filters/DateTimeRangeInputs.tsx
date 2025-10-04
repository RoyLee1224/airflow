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
import { Box, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { MdClose, MdAccessTime } from "react-icons/md";

import { Switch } from "src/components/ui";
import { useTimezone } from "src/context/timezone";
import type { DateRangeEditingState } from "src/hooks/useDateRangeFilter";
import { DATE_INPUT_FORMAT, TIME_INPUT_FORMAT } from "src/hooks/useDateRangeFilter";

type DateTimeRangeInputsProps = {
  readonly editingState: DateRangeEditingState;
  readonly endDateValue?: dayjs.Dayjs;
  readonly onChange: (
    field: "end" | "start",
    inputType: "date" | "time",
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onClearEnd: () => void;
  readonly onClearStart: () => void;
  readonly onToggleTimeMode: (enabled: boolean) => void;
  readonly setEditingState: React.Dispatch<React.SetStateAction<DateRangeEditingState>>;
  readonly setSelectionTarget: (target: "end" | "start") => void;
  readonly startDateValue?: dayjs.Dayjs;
};

export const DateTimeRangeInputs = ({
  editingState,
  endDateValue,
  onChange,
  onClearEnd,
  onClearStart,
  onToggleTimeMode,
  setEditingState,
  setSelectionTarget,
  startDateValue,
}: DateTimeRangeInputsProps) => {
  const { t: translate } = useTranslation(["common"]);
  const { selectedTimezone } = useTimezone();

  return (
    <VStack gap={3} w="full">
      <HStack justify="space-between" w="full">
        <HStack gap={1}>
          <MdAccessTime size={14} />
          <Text color="fg.muted" fontSize="xs">
            {selectedTimezone}
          </Text>
        </HStack>
        <HStack gap={2}>
          <Text fontSize="xs">{translate("common:filters.includeTime")}</Text>
          <Switch
            checked={editingState.timeEnabled}
            onCheckedChange={(details) => onToggleTimeMode(details.checked)}
            size="sm"
          />
        </HStack>
      </HStack>

      <HStack gap={2} w="full">
        <Box flex="1" position="relative">
          <Text color="fg.muted" fontSize="xs" mb={0.5}>
            {translate("common:table.from")}
          </Text>
          <Input
            _focus={{ borderColor: "brand.focusRing" }}
            borderColor={editingState.selectionTarget === "start" ? "brand.focusRing" : "border"}
            fontSize="sm"
            fontWeight="medium"
            onBlur={() => {
              if (
                startDateValue &&
                editingState.inputs.start &&
                !dayjs(editingState.inputs.start, DATE_INPUT_FORMAT, true).isValid()
              ) {
                setEditingState((prev) => ({
                  ...prev,
                  inputs: { ...prev.inputs, start: startDateValue.format(DATE_INPUT_FORMAT) },
                }));
              }
            }}
            onChange={onChange("start", "date")}
            onFocus={() => setSelectionTarget("start")}
            placeholder={DATE_INPUT_FORMAT}
            value={editingState.inputs.start}
          />
          {Boolean(editingState.inputs.start) && (
            <IconButton
              aria-label="Clear start date"
              onClick={onClearStart}
              position="absolute"
              right={1}
              size="2xs"
              top="50%"
              variant="ghost"
            >
              <MdClose size={12} />
            </IconButton>
          )}
        </Box>

        <Box flex="1" position="relative">
          <Text color="fg.muted" fontSize="xs" mb={0.5}>
            {translate("common:table.to")}
          </Text>
          <Input
            _focus={{ borderColor: "brand.focusRing" }}
            borderColor={editingState.selectionTarget === "end" ? "brand.focusRing" : "border"}
            fontSize="sm"
            fontWeight="medium"
            onBlur={() => {
              if (
                endDateValue &&
                editingState.inputs.end &&
                !dayjs(editingState.inputs.end, DATE_INPUT_FORMAT, true).isValid()
              ) {
                setEditingState((prev) => ({
                  ...prev,
                  inputs: { ...prev.inputs, end: endDateValue.format(DATE_INPUT_FORMAT) },
                }));
              }
            }}
            onChange={onChange("end", "date")}
            onFocus={() => setSelectionTarget("end")}
            placeholder={DATE_INPUT_FORMAT}
            value={editingState.inputs.end}
          />
          {Boolean(editingState.inputs.end) && (
            <IconButton
              aria-label="Clear end date"
              onClick={onClearEnd}
              position="absolute"
              right={1}
              size="2xs"
              top="50%"
              variant="ghost"
            >
              <MdClose size={12} />
            </IconButton>
          )}
        </Box>
      </HStack>

      {editingState.timeEnabled ? (
        <HStack gap={2} w="full">
          <Box flex="1">
            <Text color="fg.muted" fontSize="xs" mb={0.5}>
              {translate("common:filters.startTime")}
            </Text>
            <Input
              fontSize="sm"
              onChange={onChange("start", "time")}
              placeholder={TIME_INPUT_FORMAT}
              value={editingState.inputs.startTime}
              w="full"
            />
          </Box>

          <Box flex="1">
            <Text color="fg.muted" fontSize="xs" mb={0.5}>
              {translate("common:filters.endTime")}
            </Text>
            <Input
              fontSize="sm"
              onChange={onChange("end", "time")}
              placeholder={TIME_INPUT_FORMAT}
              value={editingState.inputs.endTime}
              w="full"
            />
          </Box>
        </HStack>
      ) : undefined}
    </VStack>
  );
};
