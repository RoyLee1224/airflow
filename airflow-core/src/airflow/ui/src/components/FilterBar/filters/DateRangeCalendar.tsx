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
import { Button, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import dayjs, { type Dayjs } from "dayjs";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

import type { DateRangeValue } from "../types";

type DateRangeCalendarProps = {
  readonly currentMonth: Dayjs;
  readonly onDateClick: (date: Dayjs) => void;
  readonly onMonthChange: (month: Dayjs) => void;
  readonly value: DateRangeValue;
};

export const DateRangeCalendar = ({
  currentMonth,
  onDateClick,
  onMonthChange,
  value,
}: DateRangeCalendarProps) => {
  const monthStart = currentMonth.startOf("month");
  const monthEnd = currentMonth.endOf("month");
  const startDate = monthStart.startOf("week");
  const endDate = monthEnd.endOf("week");

  const days = [];
  let day = startDate;

  while (day.isSameOrBefore(endDate, "day")) {
    days.push(day);
    day = day.add(1, "day");
  }

  const startDateValue = value.startDate !== null && value.startDate !== undefined && String(value.startDate).trim() !== "" ? dayjs(value.startDate) : undefined;
  const endDateValue = value.endDate !== null && value.endDate !== undefined && String(value.endDate).trim() !== "" ? dayjs(value.endDate) : undefined;

  return (
    <>
      {/* Month Navigation */}
      <HStack justify="space-between" w="full">
        <Button
          onClick={() => onMonthChange(currentMonth.subtract(1, "month"))}
          size="sm"
          variant="ghost"
        >
          <MdChevronLeft />
        </Button>
        <Text fontWeight="medium">{currentMonth.format("MMM YYYY")}</Text>
        <Button
          onClick={() => onMonthChange(currentMonth.add(1, "month"))}
          size="sm"
          variant="ghost"
        >
          <MdChevronRight />
        </Button>
      </HStack>

      {/* Calendar Grid */}
      <VStack gap={2} w="full">
        {/* Day Headers */}
        <Grid gap={1} gridTemplateColumns="repeat(7, 1fr)" w="full">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((dayName) => (
            <Text
              color="gray.500"
              fontSize="xs"
              fontWeight="medium"
              key={dayName}
              py={1}
              textAlign="center"
              w="32px"
            >
              {dayName}
            </Text>
          ))}
        </Grid>

        {/* Calendar Days */}
        <Grid gap={1} gridTemplateColumns="repeat(7, 1fr)" w="full">
          {days.map((dayItem) => {
            const isCurrentMonth = dayItem.isSame(currentMonth, "month");
            const isStartSelected = Boolean(startDateValue?.isSame(dayItem, "day"));
            const isEndSelected = Boolean(endDateValue?.isSame(dayItem, "day"));
            const isSelected = isStartSelected || isEndSelected;
            const isInRange =
              startDateValue && endDateValue &&
              dayItem.isAfter(startDateValue, "day") &&
              dayItem.isBefore(endDateValue, "day");
            const isToday = dayItem.isSame(dayjs(), "day");

            let bgColor: string | undefined;
            let textColor = isCurrentMonth ? "inherit" : "gray.400";

            if (isStartSelected) {
              bgColor = "blue.500";
              textColor = "white";
            } else if (isEndSelected) {
              bgColor = "blue.300";
              textColor = "white";
            } else if (isInRange) {
              bgColor = "blue.50";
            } else if (isToday) {
              bgColor = "red.500";
              textColor = "white";
            }

            return (
              <Button
                _hover={{
                  bg: isSelected ? bgColor : "gray.100",
                }}
                bg={bgColor}
                border="1px solid transparent"
                color={textColor}
                fontWeight="normal"
                h="32px"
                key={dayItem.format("YYYY-MM-DD")}
                minW="32px"
                onClick={() => onDateClick(dayItem)}
                p={0}
                size="sm"
                variant="ghost"
              >
                {dayItem.date()}
              </Button>
            );
          })}
        </Grid>
      </VStack>
    </>
  );
};
