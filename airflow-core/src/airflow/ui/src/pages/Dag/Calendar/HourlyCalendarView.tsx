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

/*
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
import { Box, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useTranslation } from "react-i18next";

import type { CalendarTimeRangeResponse } from "openapi/requests/types.gen";

import { CalendarTooltip } from "./CalendarTooltip";
import { createTooltipContent, generateHourlyCalendarData, getCalendarCellColor } from "./calendarUtils";
import type { FilterOperator } from "./NumberFilterControl";
import type { LegendFilter } from "./CalendarLegend";
import { useDelayedTooltip } from "./useDelayedTooltip";

dayjs.extend(isSameOrBefore);

type Props = {
  readonly cellSize: number;
  readonly data: Array<CalendarTimeRangeResponse>;
  readonly filterEnabled?: boolean;
  readonly filterOperator?: FilterOperator;
  readonly legendFilter?: LegendFilter;
  readonly numberFilter?: number;
  readonly selectedMonth: number;
  readonly selectedYear: number;
  readonly showNumbers?: boolean;
};

export const HourlyCalendarView = ({
  cellSize,
  data,
  filterEnabled = false,
  filterOperator = ">",
  legendFilter = "all",
  numberFilter = 0,
  selectedMonth,
  selectedYear,
  showNumbers = true,
}: Props) => {
  const { t: translate } = useTranslation("dag");
  const hourlyData = generateHourlyCalendarData(data, selectedYear, selectedMonth);
  const { handleMouseEnter, handleMouseLeave } = useDelayedTooltip();

  const shouldShowNumber = (totalRuns: number): boolean => {
    if (!showNumbers) {
      return false;
    }

    switch (filterOperator) {
      case "<":
        return totalRuns < numberFilter;
      case "=":
        return totalRuns === numberFilter;
      case ">":
        return totalRuns > numberFilter;
      default:
        return totalRuns >= numberFilter;
    }
  };

  const shouldShowCell = (totalRuns: number): boolean => {
    if (!filterEnabled) {return true;}

    switch (filterOperator) {
      case "<":
        return totalRuns < numberFilter;
      case "=":
        return totalRuns === numberFilter;
      case ">":
        return totalRuns > numberFilter;
      default:
        return totalRuns >= numberFilter;
    }
  };

  const matchesLegendFilter = (runs: Array<CalendarTimeRangeResponse>): boolean => {
    if (legendFilter === "all") {return true;}
    if (runs.length === 0) {return legendFilter === "gray";}

    const counts = { failed: 0, planned: 0, queued: 0, running: 0, success: 0, total: 0 };

    runs.forEach((run) => {
      const { count, state } = run;

      if (state in counts) {
        counts[state] += count;
      }
      counts.total += count;
    });

    // Check priority states first (same logic as getCalendarCellColor)
    if (counts.queued > 0 && legendFilter === "queued.600") {return true;}
    if (counts.running > 0 && legendFilter === "blue.400") {return true;}
    if (counts.planned > 0 && legendFilter === "scheduled") {return true;}

    // If there are priority states but user selected a success rate filter, don't match
    if ((counts.queued > 0 || counts.running > 0 || counts.planned > 0) &&
        ["failed.600", "success.400", "success.500", "success.600", "up_for_retry.500", "upstream_failed.500"].includes(legendFilter)) {
      return false;
    }

    // Check success rate rules
    if (counts.total > 0) {
      const successRate = counts.success / counts.total;

      if (legendFilter === "success.600" && successRate === 1) {return true;}
      if (legendFilter === "success.500" && successRate >= 0.8 && successRate < 1) {return true;}
      if (legendFilter === "success.400" && successRate >= 0.6 && successRate < 0.8) {return true;}
      if (legendFilter === "up_for_retry.500" && successRate >= 0.4 && successRate < 0.6) {return true;}
      if (legendFilter === "upstream_failed.500" && successRate >= 0.2 && successRate < 0.4) {return true;}

      if (counts.failed > 0 && successRate < 0.2) {
        return legendFilter === "failed.600";
      }
    }

    // Gray for no data
    if (counts.total === 0) {
      return legendFilter === "gray";
    }

    return false;
  };

  return (
    <Box mb={4}>
      <Box mb={4}>
        <Box display="flex" mb={2}>
          <Box width="40px" />
          <Box display="flex" gap={1}>
            {hourlyData.days.map((day, index) => {
              const isFirstOfWeek = index % 7 === 0;
              const weekNumber = Math.floor(index / 7) + 1;

              return (
                <Box
                  key={day.day}
                  marginRight={index % 7 === 6 ? "8px" : "0"}
                  position="relative"
                  width={`${cellSize}px`}
                >
                  {Boolean(isFirstOfWeek) && (
                    <Text
                      color="fg.muted"
                      fontSize="sm"
                      fontWeight="bold"
                      left="0"
                      position="absolute"
                      textAlign="left"
                      top="-25px"
                      whiteSpace="nowrap"
                    >
                      {translate("calendar.week", { weekNumber })}
                    </Text>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
        <Box display="flex" mb={1}>
          <Box width="40px" />
          <Box display="flex" gap={1}>
            {hourlyData.days.map((day, index) => {
              const dayOfWeek = dayjs(day.day).day();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const fontSize = cellSize < 18 ? "2xs" : "xs";
              const dayName =
                cellSize < 18 ? dayjs(day.day).format("dd").charAt(0) : dayjs(day.day).format("dd");

              return (
                <Box key={day.day} marginRight={index % 7 === 6 ? "8px" : "0"} width={`${cellSize}px`}>
                  <Text
                    color={isWeekend ? "red.400" : "gray.600"}
                    fontSize={fontSize}
                    fontWeight={isWeekend ? "bold" : "normal"}
                    lineHeight="1"
                    textAlign="center"
                  >
                    {dayjs(day.day).format("D")}
                  </Text>
                  <Text
                    color={isWeekend ? "red.400" : "gray.500"}
                    fontSize={fontSize}
                    fontWeight={isWeekend ? "bold" : "normal"}
                    lineHeight="1"
                    mt="1px"
                    textAlign="center"
                  >
                    {dayName}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      <Box display="flex" gap={2}>
        <Box display="flex" flexDirection="column" gap={1}>
          {Array.from({ length: 24 }, (_, hour) => (
            <Box
              alignItems="center"
              color="gray.500"
              display="flex"
              fontSize="xs"
              height={`${cellSize}px`}
              justifyContent="flex-end"
              key={hour}
              pr={2}
              width="30px"
            >
              {hour % 4 === 0 && hour.toString().padStart(2, "0")}
            </Box>
          ))}
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          {Array.from({ length: 24 }, (_, hour) => (
            <Box display="flex" gap={1} key={hour}>
              {hourlyData.days.map((day, index) => {
                const hourData = day.hours.find((hourItem) => hourItem.hour === hour);

                if (!hourData) {
                  const noRunsTooltip = `${dayjs(day.day).format("MMM DD")}, ${hour.toString().padStart(2, "0")}:00 - No runs`;

                  return (
                    <Box
                      key={`${day.day}-${hour}`}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      position="relative"
                    >
                      <Box
                        alignItems="center"
                        bg={getCalendarCellColor([])}
                        borderRadius="2px"
                        cursor="pointer"
                        display="flex"
                        height={`${cellSize}px`}
                        justifyContent="center"
                        marginRight={index % 7 === 6 ? "8px" : "0"}
                        width={`${cellSize}px`}
                      />
                      <CalendarTooltip cellSize={cellSize} content={noRunsTooltip} />
                    </Box>
                  );
                }

                const tooltipContent =
                  hourData.counts.total > 0
                    ? `${dayjs(day.day).format("MMM DD")}, ${hour.toString().padStart(2, "0")}:00 - ${createTooltipContent(hourData).split(": ")[1]}`
                    : `${dayjs(day.day).format("MMM DD")}, ${hour.toString().padStart(2, "0")}:00 - No runs`;

                const totalRuns = hourData.counts.total;
                const fontSize = cellSize >= 20 ? "xs" : cellSize >= 16 ? "2xs" : "1xs";
                const cellColor = getCalendarCellColor(hourData.runs);
                const matchesNumberFilter = shouldShowCell(totalRuns);
                const matchesLegend = matchesLegendFilter(hourData.runs);
                const shouldHighlight = matchesNumberFilter && matchesLegend;

                return (
                  <Box
                    key={`${day.day}-${hour}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    position="relative"
                  >
                    <Box
                      alignItems="center"
                      bg={cellColor}
                      borderRadius="2px"
                      cursor="pointer"
                      display="flex"
                      height={`${cellSize}px`}
                      justifyContent="center"
                      marginRight={index % 7 === 6 ? "8px" : "0"}
                      opacity={shouldHighlight ? 1 : 0.3}
                      width={`${cellSize}px`}
                    >
                      {shouldShowNumber(totalRuns) ? (
                        <Text
                          color="white"
                          fontSize={fontSize}
                          fontWeight="semibold"
                          lineHeight="1"
                          textShadow="0 1px 2px rgba(0,0,0,0.5)"
                        >
                          {totalRuns}
                        </Text>
                      ) : undefined}
                    </Box>
                    <CalendarTooltip cellSize={cellSize} content={tooltipContent} />
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
