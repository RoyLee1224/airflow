<!--
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
-->

# Screenshot Mapping

This document maps each documentation screenshot to its corresponding test file and test case.

## Currently Implemented

| Screenshot File | Test File | Test Name | Documentation Page |
|----------------|-----------|-----------|-------------------|
| `home_light.png` | `dagsList.spec.ts` | "captures home page screenshot" | `docs/ui.rst` - Home Page |
| `home_dark.png` | `dagsList.spec.ts` | "captures home page screenshot" | `docs/ui.rst` - Home Page |
| `dag_list.png` | `dagsList.spec.ts` | "captures dag_list screenshot" | `docs/ui.rst` - DAG List View |
| `dag_overview_dashboard.png` | `dagDetails.spec.ts` | "captures dag overview dashboard" | `docs/ui.rst` - DAG Overview |
| `dag_overview_grid.png` | `dagDetails.spec.ts` | "captures dag overview grid view" | `docs/ui.rst` - Grid View |
| `dag_overview_graph.png` | `dagDetails.spec.ts` | "captures dag overview graph view" | `docs/ui.rst` - Graph View |
| `dag_overview_code.png` | `dagDetails.spec.ts` | "captures dag overview code view" | `docs/ui.rst` - Code View |
| `dag_overview_details.png` | `dagDetails.spec.ts` | "captures dag overview details tab" | `docs/ui.rst` - Details Tab |
| `dag_overview_events.png` | `dagDetails.spec.ts` | "captures dag overview events tab" | `docs/ui.rst` - Events Tab |

## Screenshots Referenced in Documentation (To Be Implemented)

Based on analysis of `docs/ui.rst` and other documentation files, these screenshots still need test coverage:

### High Priority (Frequently Used)

| Screenshot File | Suggested Test File | Notes |
|----------------|--------------------|----|
| `dag_list_asset_condition_popup.png` | `dagsList.spec.ts` | Asset condition popup modal |
| `grid.png` | `dagDetails.spec.ts` | Grid view standalone |
| `graph.png` | `dagDetails.spec.ts` | Graph view standalone |
| `dag_run_details.png` | `dagRuns.spec.ts` | DAG run detail panel |
| `dag_task_instance_logs.png` | `taskInstance.spec.ts` | Task instance log viewer |
| `variable_hidden.png` | `variables.spec.ts` | Variables page with hidden values |
| `connection_create.png` | `connections.spec.ts` | Connection creation form |
| `connection_edit.png` | `connections.spec.ts` | Connection edit form |

### Medium Priority

| Screenshot File | Suggested Test File | Notes |
|----------------|--------------------|----|
| `trigger-dag-tutorial-form-1.png` | `triggerDag.spec.ts` | Trigger DAG form - step 1 |
| `trigger-dag-tutorial-form-2.png` | `triggerDag.spec.ts` | Trigger DAG form - step 2 |
| `trigger-dag-tutorial-form-3.png` | `triggerDag.spec.ts` | Trigger DAG form - step 3 |
| `trigger-dag-tutorial-form-4.png` | `triggerDag.spec.ts` | Trigger DAG form - step 4 |
| `grid_task_details.png` | `dagDetails.spec.ts` | Grid view with task details panel |
| `grid_task_group.png` | `dagDetails.spec.ts` | Grid view showing task groups |
| `grid_mapped_task.png` | `dagDetails.spec.ts` | Grid view with mapped tasks |
| `task_instance_history.png` | `taskInstance.spec.ts` | Task instance history view |
| `task_doc.png` | `taskInstance.spec.ts` | Task documentation panel |

### Advanced Features (Lower Priority)

| Screenshot File | Suggested Test File | Notes |
|----------------|--------------------|----|
| `setup-teardown-simple.png` | `setupTeardown.spec.ts` | Setup/teardown pattern |
| `setup-teardown-complex.png` | `setupTeardown.spec.ts` | Complex setup/teardown |
| `mapping_simple_graph.png` | `dynamicTaskMapping.spec.ts` | Dynamic task mapping |
| `edge_label_example.png` | `dagDetails.spec.ts` | Edge labels in graph view |
| `hitl_approve_reject.png` | `humanInTheLoop.spec.ts` | HITL approve/reject |
| `hitl_wait_for_input.png` | `humanInTheLoop.spec.ts` | HITL wait for input |

## Implementation Progress

- ✅ **Implemented**: 9 screenshots (2 pages)
- 🔄 **High Priority**: ~8 screenshots
- 📋 **Medium Priority**: ~9 screenshots
- 🎯 **Advanced**: ~6 screenshots

**Total Coverage**: ~9 of ~90+ documentation screenshots (10%)

## Adding New Screenshots

When adding a new screenshot test:

1. Ensure your Breeze environment has the necessary test data
2. Create or update the appropriate test file in `tests/snapshots/`
3. Use the `takeDocScreenshot` helper with appropriate options
4. Update this mapping document with the new screenshot
5. Test both light and dark themes (automatic with current setup)

## Notes

- All screenshots are automatically generated for both light and dark themes
- Screenshots are saved to `docs/img/ui-light/` and `docs/img/ui-dark/`
- Test names should be descriptive and match the screenshot purpose
- Tests use real data from the Breeze backend environment
