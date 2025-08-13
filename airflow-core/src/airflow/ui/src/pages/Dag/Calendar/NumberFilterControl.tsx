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
import { HStack, Text, Input } from "@chakra-ui/react";
import { FiFilter } from "react-icons/fi";

type Props = {
  readonly numberFilter: number;
  readonly onFilterChange: (value: number) => void;
  readonly showNumbers: boolean;
};

export const NumberFilterControl = ({ numberFilter, onFilterChange, showNumbers }: Props) => {
  if (!showNumbers) {
    return undefined;
  }

  return (
    <HStack align="center" gap={1}>
      <FiFilter color="gray" size={14} />
      <Text color="fg.muted" fontSize="xs" minWidth="20px">
        ≥
      </Text>
      <Input
        max={999}
        min={1}
        onChange={(event) => onFilterChange(Math.max(1, parseInt(event.target.value, 10) || 1))}
        size="sm"
        textAlign="center"
        type="number"
        value={numberFilter}
        width="60px"
      />
    </HStack>
  );
};
