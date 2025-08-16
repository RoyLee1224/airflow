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

import type { CalendarTimeRangeResponse } from "openapi/requests/types.gen";

import { CalendarTooltip } from "./CalendarTooltip";
import { createTooltipContent, generateDailyCalendarData, getCalendarCellColor } from "./calendarUtils";
import type { FilterOperator } from "./NumberFilterControl";
import type { LegendFilter } from "./CalendarLegend";
import { useDelayedTooltip } from "./useDelayedTooltip";

type Props = {
  readonly cellSize: number;
  readonly data: Array<CalendarTimeRangeResponse>;
  readonly filterEnabled?: boolean;
  readonly filterOperator?: FilterOperator;
  readonly legendFilter?: LegendFilter;
  readonly numberFilter?: number;
  readonly selectedYear: number;
  readonly showNumbers?: boolean;
};

export const DailyCalendarView = ({
  cellSize,
  data,
  filterEnabled = false,
  filterOperator = ">",
  legendFilter = "all",
  numberFilter = 0,
  selectedYear,
  showNumbers = true,
}: Props) => {
  const dailyData = generateDailyCalendarData(data, selectedYear);
  const { handleMouseEnter, handleMouseLeave } = useDelayedTooltip();

  const shouldShowNumber = (totalRuns: number): boolean => {
    if (!showNumbers) {return false;}

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
      <Box display="flex" mb={2}>
        <Box width="50px" />
        <Box display="flex" gap={1}>
          {dailyData.map((week, index) => (
            <Box key={`month-${week[0]?.date ?? index}`} position="relative" width={`${cellSize}px`}>
              {Boolean(week[0] && dayjs(week[0].date).date() <= 7) && (
                <Text color="fg.muted" fontSize="xs" left="0" position="absolute" top="-20px">
                  {dayjs(week[0]?.date).format("MMM")}
                </Text>
              )}
            </Box>
          ))}
        </Box>
      </Box>
      <Box display="flex" gap={2}>
        <Box display="flex" flexDirection="column" gap={1}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Box
              alignItems="center"
              color="fg.muted"
              display="flex"
              fontSize="xs"
              height={`${cellSize}px`}
              justifyContent="flex-end"
              key={day}
              pr={2}
              width="40px"
            >
              {day}
            </Box>
          ))}
        </Box>
        <Box display="flex" gap={1}>
          {dailyData.map((week, weekIndex) => (
            <Box display="flex" flexDirection="column" gap={1} key={`week-${week[0]?.date ?? weekIndex}`}>
              {week.map((day) => {
                const dayDate = dayjs(day.date);
                const isInSelectedYear = dayDate.year() === selectedYear;

                if (!isInSelectedYear) {
                  return (
                    <Box bg="transparent" height={`${cellSize}px`} key={day.date} width={`${cellSize}px`} />
                  );
                }

                const totalRuns = day.counts.total;
                const fontSize = cellSize >= 20 ? "xs" : cellSize >= 16 ? "2xs" : "1xs";
                const cellColor = getCalendarCellColor(day.runs);
                const matchesNumberFilter = shouldShowCell(totalRuns);
                const matchesLegend = matchesLegendFilter(day.runs);
                const shouldHighlight = matchesNumberFilter && matchesLegend;

                return (
                  <Box
                    key={day.date}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    position="relative"
                  >
                    <Box
                      _hover={{ transform: shouldHighlight ? "scale(1.1)" : "scale(1.02)" }}
                      alignItems="center"
                      bg={cellColor}
                      borderRadius="2px"
                      cursor="pointer"
                      display="flex"
                      height={`${cellSize}px`}
                      justifyContent="center"
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
                    <CalendarTooltip cellSize={cellSize} content={createTooltipContent(day)} />
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
