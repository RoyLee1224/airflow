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
import { useMemo, useRef } from "react";
import type { RefObject } from "react";

import type { TooltipPosition } from "./BaseTooltip";
import { calculateBestPosition, parseMinWidth } from "./tooltipUtils";

type UseTooltipPositionProps = {
  readonly estimatedHeight?: number;
  readonly minWidth: string;
  readonly position: TooltipPosition;
  readonly tooltipOffset: number;
  readonly triggerRef: RefObject<HTMLElement>;
};

export const useTooltipPosition = ({
  estimatedHeight = 80,
  minWidth,
  position,
  tooltipOffset,
  triggerRef,
}: UseTooltipPositionProps) => {
  const positionRef = useRef<TooltipPosition | undefined>(undefined);

  return useMemo(() => {
    if (!triggerRef.current) {
      return undefined;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = parseMinWidth(minWidth);

    // Calculate position only once and stick with it
    positionRef.current ??= calculateBestPosition({
      dimensions: { estimatedHeight, offset: tooltipOffset, width: tooltipWidth },
      preferredPosition: position,
      rect,
      viewport: { height: globalThis.innerHeight, width: globalThis.innerWidth },
    });

    return {
      finalPosition: positionRef.current,
      rect,
      tooltipWidth,
    };
  }, [estimatedHeight, minWidth, position, tooltipOffset, triggerRef]);
};
