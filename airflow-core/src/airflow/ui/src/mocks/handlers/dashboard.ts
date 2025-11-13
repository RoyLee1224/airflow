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
import { http, HttpResponse, type HttpHandler } from "msw";

export const handlers: Array<HttpHandler> = [
  // DAG stats endpoint
  http.get("/ui/dashboard/dag_stats", () => {
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return HttpResponse.json({
      dag_run_states: {
        failed: 2,
        queued: 1,
        running: 3,
        success: 45,
      },
      dag_run_types: {
        backfill: 0,
        dataset_triggered: 5,
        manual: 10,
        scheduled: 35,
      },
    });
  }),

  // Task instance stats endpoint
  http.get("/ui/dashboard/task_instance_stats", () =>
    HttpResponse.json({
      task_instance_states: {
        failed: 5,
        queued: 3,
        running: 8,
        success: 234,
        up_for_retry: 1,
      },
    }),
  ),

  // Historical metrics endpoint
  http.get("/ui/dashboard/historical_metrics", () => {
    const now = new Date();
    const data = [];

    // Generate 24 hours of historical data
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        dag_run_states: {
          failed: Math.floor(Math.random() * 3),
          queued: Math.floor(Math.random() * 5),
          running: Math.floor(Math.random() * 10),
          success: Math.floor(Math.random() * 20) + 10,
        },
        task_instance_states: {
          failed: Math.floor(Math.random() * 5),
          queued: Math.floor(Math.random() * 10),
          running: Math.floor(Math.random() * 20),
          success: Math.floor(Math.random() * 50) + 20,
        },
        timestamp: timestamp.toISOString(),
      });
    }

    return HttpResponse.json({ data });
  }),
];
