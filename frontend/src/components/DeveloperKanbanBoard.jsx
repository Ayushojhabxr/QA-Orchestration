import { motion } from "framer-motion";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import StrictModeDroppable from "./StrictModeDroppable";

const columnConfig = [
  { id: "Pending", title: "Pending", accent: "from-slate-500 to-slate-300" },
  { id: "In Progress", title: "In Progress", accent: "from-aurora to-glow" },
  { id: "Testing", title: "Testing", accent: "from-sky-400 to-indigo-300" },
  { id: "Fixed", title: "Fixed", accent: "from-glow to-emerald-300" },
  { id: "Closed", title: "Closed", accent: "from-flare to-amber-300" },
];

const priorityClasses = {
  Low: "bg-slate-700/70 text-slate-100",
  Medium: "bg-sky-500/20 text-sky-200",
  High: "bg-orange-500/20 text-orange-200",
  Critical: "bg-rose-500/20 text-rose-200",
};

function DeveloperKanbanBoard({
  groupedItems,
  onDragEnd,
  onSelect,
  selectedId,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-4">
        {columnConfig.map((column) => {
          const items = groupedItems[column.id] || [];

          return (
            <StrictModeDroppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <motion.div
                  layout
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-[1.75rem] border p-4 transition-all ${
                    snapshot.isDraggingOver
                      ? "border-glow bg-glow/10"
                      : "border-slate-800 bg-slate-950/35"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Workflow</p>
                      <h3 className="mt-2 font-display text-xl font-semibold text-white">
                        {column.title}
                      </h3>
                    </div>
                    <div
                      className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-slate-950 ${column.accent}`}
                    >
                      {items.length}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <Draggable draggableId={item._id} index={index} key={item._id}>
                        {(dragProvided, dragSnapshot) => (
                          <motion.button
                            layout
                            type="button"
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            onClick={() => onSelect(item)}
                            className={`w-full rounded-3xl border p-4 text-left transition-all ${
                              selectedId === item._id
                                ? "border-glow bg-glow/10"
                                : "border-slate-800 bg-slate-950/50 hover:border-slate-600"
                            } ${dragSnapshot.isDragging ? "shadow-2xl shadow-cyan-500/20" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-display text-lg font-semibold text-white">
                                  {item.scenarioId}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                                  {item.sheetName}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  priorityClasses[item.priority] || priorityClasses.Medium
                                }`}
                              >
                                {item.priority}
                              </span>
                            </div>
                            <p className="mt-3 max-h-16 overflow-hidden text-sm text-slate-300">
                              {item.description}
                            </p>
                            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                              {item.project?.name || "No Project"}
                            </p>
                            <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                              <span>{item.testerName}</span>
                              <span>{item.status}</span>
                            </div>
                          </motion.button>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {!items.length ? (
                      <div className="rounded-3xl border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
                        No cards in this column.
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </StrictModeDroppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}

export default DeveloperKanbanBoard;
