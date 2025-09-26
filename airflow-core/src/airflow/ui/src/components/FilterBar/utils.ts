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
import type { DateRangeValue, FilterConfig, FilterValue } from "./types";

/**
 * Checks if a filter value is valid and non-empty
 */
export const isValidFilterValue = (type: string, value: FilterValue): boolean => {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  if (type === "daterange" && typeof value === "object") {
    const rangeValue = value as DateRangeValue;

    return Boolean(rangeValue.startDate && String(rangeValue.startDate).trim() !== "") ||
           Boolean(rangeValue.endDate && String(rangeValue.endDate).trim() !== "");
  }

  return true;
};

/**
 * Generates a default value for a filter based on its configuration
 */
export const getDefaultFilterValue = (config: FilterConfig): FilterValue => {
  if (config.defaultValue !== undefined) {
    return config.defaultValue;
  }

  if (config.type === "daterange") {
    return { endDate: undefined, startDate: undefined };
  }

  return "";
};

/**
 * Parses a date string or returns undefined if invalid
 */
export const parseFilterDate = (date?: string | null) => (date !== null && date !== undefined && String(date).trim() !== "") ? date : undefined;

/**
 * Checks if a date value is valid and non-empty
 */
export const isValidDateValue = (date?: string | null): boolean => date !== null && date !== undefined && String(date).trim() !== "";
