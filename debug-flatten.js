// Debug script to understand flattenNodes behavior
const mockNodes = [
  { id: "start", type: "task", children: null },
  {
    id: "section_1",
    type: "task", 
    children: [
      { id: "section_1.task_1", type: "task", children: null },
      { id: "section_1.task_2", type: "task", children: null },
      { id: "section_1.task_3", type: "task", children: null },
    ]
  },
  {
    id: "section_2",
    type: "task",
    children: [
      { id: "section_2.task_1", type: "task", children: null },
      {
        id: "section_2.inner_section_2",
        type: "task",
        children: [
          { id: "section_2.inner_section_2.task_2", type: "task", children: null },
          { id: "section_2.inner_section_2.task_3", type: "task", children: null },
          { id: "section_2.inner_section_2.task_4", type: "task", children: null },
        ]
      }
    ]
  },
  { id: "end", type: "task", children: null }
];

const openGroupIds = ["section_1", "section_2", "section_2.inner_section_2"];

// Simulate flattenNodes function
function flattenNodes(nodes, openGroupIds, depth = 0) {
  let flatNodes = [];
  let allGroupIds = [];

  nodes.forEach((node) => {
    if (node.type === "task") {
      if (node.children) {
        const { children, ...rest } = node;
        const isOpen = openGroupIds.includes(node.id);
        const groupIndex = flatNodes.length;

        // Add the group node
        flatNodes.push({ 
          ...rest, 
          depth, 
          isGroup: true, 
          isOpen,
          firstChildIndex: undefined,
        });
        allGroupIds.push(node.id);

        if (isOpen) {
          const { allGroupIds: childGroupIds, flatNodes: childNodes } = flattenNodes(
            children,
            openGroupIds,
            depth + 1,
          );

          // Now we know where the first child will be
          const firstChildIndex = flatNodes.length;
          
          // Update the group's firstChildIndex
          if (flatNodes[groupIndex]) {
            flatNodes[groupIndex].firstChildIndex = childNodes.length > 0 ? firstChildIndex : undefined;
          }

          // Mark navigation relationships for child nodes
          const enhancedChildNodes = childNodes.map((childNode, index) => ({
            ...childNode,
            parentId: node.id,
            isFirstChildOfParent: index === 0,
          }));

          flatNodes = [...flatNodes, ...enhancedChildNodes];
          allGroupIds = [...allGroupIds, ...childGroupIds];
        }
      } else {
        flatNodes.push({ ...node, depth });
      }
    }
  });

  return { allGroupIds, flatNodes };
}

const result = flattenNodes(mockNodes, openGroupIds);

console.log("=== flatNodes structure ===");
result.flatNodes.forEach((node, index) => {
  console.log(`${index}: ${node.id} ${node.isGroup ? '(group)' : '(task)'} firstChild: ${node.firstChildIndex} parent: ${node.parentId} isFirst: ${node.isFirstChildOfParent}`);
});

// Test navigation for section_2.inner_section_2
const innerSectionIndex = result.flatNodes.findIndex(n => n.id === "section_2.inner_section_2");
const innerSection = result.flatNodes[innerSectionIndex];
console.log(`\n=== section_2.inner_section_2 analysis ===`);
console.log(`Index: ${innerSectionIndex}`);
console.log(`FirstChildIndex: ${innerSection.firstChildIndex}`);
if (innerSection.firstChildIndex !== undefined) {
  const firstChild = result.flatNodes[innerSection.firstChildIndex];
  console.log(`First child: ${firstChild?.id}`);
} 