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
import { Box, HStack, Input, Text, VStack } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MdCalendarToday } from "react-icons/md";

import { Popover } from "src/components/ui";

import { FilterPill } from "../FilterPill";
import type { DateRangeValue, FilterPluginProps } from "../types";
import { isValidDateValue } from "../utils";
import { DateRangeCalendar } from "./DateRangeCalendar";

type DateSelection = "end" | "start" | undefined;

export const DateRangeFilter = ({ filter, onChange, onRemove }: FilterPluginProps) => {
  const { t: translate } = useTranslation(["common"]);
  const value = (filter.value !== null && filter.value !== undefined && typeof filter.value === 'object')
    ? (filter.value as DateRangeValue)
    : { endDate: undefined, startDate: undefined };

  const startDateValue = isValidDateValue(value.startDate) ? dayjs(value.startDate) : undefined;
  const endDateValue = isValidDateValue(value.endDate) ? dayjs(value.endDate) : undefined;
  const hasStartDate = Boolean(startDateValue);
  const hasEndDate = Boolean(endDateValue);
  const hasValue = hasStartDate || hasEndDate;

  const [currentMonth, setCurrentMonth] = useState(() => dayjs());
  const [dateSelection, setDateSelection] = useState<DateSelection>(undefined);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  useEffect(() => {
    if (startDateValue && !startDateInput) {
      setStartDateInput(startDateValue.format("YYYY/MM/DD"));
    }
    if (endDateValue && !endDateInput) {
      setEndDateInput(endDateValue.format("YYYY/MM/DD"));
    }
  }, [startDateValue, endDateValue, startDateInput, endDateInput]);

  const formatDisplayValue = () => {
    if (!startDateValue && !endDateValue) {return "";}
    if (startDateValue && endDateValue) {
      return `${startDateValue.format("MMM DD, YYYY")} - ${endDateValue.format("MMM DD, YYYY")}`;
    }
    if (startDateValue) {return `From ${startDateValue.format("MMM DD, YYYY")}`;}

    return `To ${endDateValue?.format("MMM DD, YYYY") ?? ""}`;
  };

  const handleDateClick = (date: dayjs.Dayjs) => {
    const dateStr = date.toISOString();

    if (dateSelection === "start" || (!hasStartDate && !hasEndDate)) {
      onChange({
        ...value,
        startDate: dateStr,
      });
      setStartDateInput(date.format("YYYY/MM/DD"));
      setDateSelection("end");
    } else if (dateSelection === "end" || hasStartDate) {
      if (startDateValue && date.isBefore(startDateValue)) {
        onChange({
          endDate: value.startDate,
          startDate: dateStr,
        });
        setStartDateInput(date.format("YYYY/MM/DD"));
        setEndDateInput(startDateValue.format("YYYY/MM/DD"));
      } else {
        onChange({
          ...value,
          endDate: dateStr,
        });
        setEndDateInput(date.format("YYYY/MM/DD"));
      }
      setDateSelection(undefined);
    }
  };

  const handleStartDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    setStartDateInput(inputValue);

    const parsedDate = dayjs(inputValue, "YYYY/MM/DD", true);

    if (parsedDate.isValid()) {
      onChange({
        ...value,
        startDate: parsedDate.toISOString(),
      });
      setCurrentMonth(parsedDate);
    }
  };

  const handleEndDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    setEndDateInput(inputValue);

    const parsedDate = dayjs(inputValue, "YYYY/MM/DD", true);

    if (parsedDate.isValid()) {
      onChange({
        ...value,
        endDate: parsedDate.toISOString(),
      });
      setCurrentMonth(parsedDate);
    }
  };

  const renderCalendar = () => (
    <VStack gap={4} w="full">
      <HStack gap={3} w="full">
        <Box
          border="2px solid"
          borderColor={dateSelection === "start" ? "blue.500" : "gray.300"}
          borderRadius="md"
          flex="1"
          p={2}
          transition="border-color 0.2s"
        >
          <Text color="gray.600" fontSize="xs" mb={1}>
            {translate("from") || "From"}
          </Text>
          <Input
            _focus={{ boxShadow: "none" }}
            border="none"
            fontSize="sm"
            fontWeight="medium"
            onBlur={() => {
              if (startDateValue && startDateInput && !dayjs(startDateInput, "YYYY/MM/DD", true).isValid()) {
                setStartDateInput(startDateValue.format("YYYY/MM/DD"));
              }
            }}
            onChange={handleStartDateInputChange}
            onFocus={() => setDateSelection("start")}
            p={0}
            placeholder="YYYY/MM/DD"
            value={startDateInput || (startDateValue ? startDateValue.format("YYYY/MM/DD") : "")}
          />
        </Box>
        <Box
          border="2px solid"
          borderColor={dateSelection === "end" ? "blue.500" : "gray.300"}
          borderRadius="md"
          flex="1"
          p={2}
          transition="border-color 0.2s"
        >
          <Text color="gray.600" fontSize="xs" mb={1}>
            {translate("to") || "To"}
          </Text>
          <Input
            _focus={{ boxShadow: "none" }}
            border="none"
            fontSize="sm"
            fontWeight="medium"
            onBlur={() => {
              if (endDateValue && endDateInput && !dayjs(endDateInput, "YYYY/MM/DD", true).isValid()) {
                setEndDateInput(endDateValue.format("YYYY/MM/DD"));
              }
            }}
            onChange={handleEndDateInputChange}
            onFocus={() => setDateSelection("end")}
            p={0}
            placeholder="YYYY/MM/DD"
            value={endDateInput || (endDateValue ? endDateValue.format("YYYY/MM/DD") : "")}
          />
        </Box>
      </HStack>
      <DateRangeCalendar
        currentMonth={currentMonth}
        onDateClick={handleDateClick}
        onMonthChange={setCurrentMonth}
        value={value}
      />
    </VStack>
  );

  return (
    <FilterPill
      displayValue={formatDisplayValue()}
      filter={filter}
      hasValue={hasValue}
      onChange={onChange}
      onRemove={onRemove}
    >
      <Popover.Root>
        <Popover.Trigger asChild>
          <Box
            alignItems="center"
            bg="bg"
            border="0.5px solid"
            borderColor="border"
            borderRadius="full"
            cursor="pointer"
            display="flex"
            h="full"
            overflow="hidden"
            width="400px"
          >
            <Text
              alignItems="center"
              bg="gray.muted"
              borderLeftRadius="full"
              display="flex"
              fontSize="sm"
              fontWeight="medium"
              h="full"
              px={4}
              py={2}
              whiteSpace="nowrap"
            >
              {filter.config.label}:
            </Text>
            <HStack flex="1" gap={2} px={3} py={1}>
              <MdCalendarToday />
              <Text color={hasValue ? "inherit" : "gray.500"} fontSize="sm">
                {hasValue ? formatDisplayValue() : translate("selectDateRange") || "Select date range"}
              </Text>
            </HStack>
          </Box>
        </Popover.Trigger>
        <Popover.Content p={4} w="320px">
          {renderCalendar()}
        </Popover.Content>
      </Popover.Root>
    </FilterPill>
  );
};
