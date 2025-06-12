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
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { FiFolder } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";

type FolderData = {
  dagCount: number;
  description: string;
  id: string;
  name: string;
};

type FolderCardProps = {
  readonly folder: FolderData;
};

const FolderCard = ({ folder }: FolderCardProps) => (
  <Box _hover={{ shadow: "md" }} bg="white" borderRadius="md" borderWidth="1px" p={4} shadow="sm">
    <VStack alignItems="stretch" gap={3}>
      <HStack>
        <FiFolder />
        <Text fontSize="lg" fontWeight="bold">
          {folder.name}
        </Text>
      </HStack>

      <Text color="gray.600" fontSize="sm">
        {folder.description}
      </Text>

      <Text color="blue.600" fontSize="sm">
        {folder.dagCount} Dags
      </Text>

      <RouterLink to={`/folders/${folder.id}`}>
        <Button colorScheme="blue" size="sm" variant="outline" width="full">
          View Dags
        </Button>
      </RouterLink>
    </VStack>
  </Box>
);

export default FolderCard;
