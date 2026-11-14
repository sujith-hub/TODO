
"use client";

import { useState } from "react";

import {
  CheckCircle,
  Circle,
  Trash2,
  Pencil,
  Eye,
  X,
  Clock,
  CalendarDays,
} from "lucide-react";

export default function TaskList({ tasks, onToggle, onDelete, onEdit }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const priorityStyles = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-orange-100 text-orange-700",
    Low: "bg-green-100 text-green-700",
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl text-center shadow-sm">
        <p className="text-gray-500">
          No tasks yet. Add your first task!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`bg-white p-5 rounded-xl shadow-sm border flex items-center justify-between gap-4 ${
              task.completed
                ? "border-green-200"
                : "border-gray-100"
            }`}
          >
            {/* Task Information */}
            <div className="flex items-start gap-3 min-w-0">
              <button
                onClick={() => onToggle(task.id)}
                className="mt-1 text-purple-600"
                aria-label={
                  task.completed ? "Mark pending" : "Mark completed"
                }
              >
                {task.completed ? (
                  <CheckCircle size={22} />
                ) : (
                  <Circle size={22} />
                )}
              </button>

              <div className="min-w-0">
                <h3
                  className={`font-semibold break-words ${
                    task.completed
                      ? "line-through text-gray-400"
                      : "text-gray-800"
                  }`}
                >
                  {task.title}
                </h3>

                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {task.description}
                  </p>
                )}

                {/* Priority, Category and Due Date */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      priorityStyles[task.priority] ||
                      priorityStyles.Medium
                    }`}
                  >
                    {task.priority || "Medium"} Priority
                  </span>

                  <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold">
                    {task.category || "Personal"}
                  </span>

                  {task.due_date || task.dueDate ? (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <CalendarDays size={14} />
                      Due: {task.due_date || task.dueDate}
                    </span>
                  ) : null}
                </div>

                {/* Status */}
                <div className="mt-2">
                  {task.completed ? (
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Clock size={14} />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setSelectedTask(task)}
                className="text-purple-500 hover:text-purple-700"
                aria-label="View task details"
              >
                <Eye size={19} />
              </button>

              <button
                onClick={() => onEdit(task)}
                className="text-blue-500 hover:text-blue-700"
                aria-label="Edit task"
              >
                <Pencil size={19} />
              </button>

              <button
                onClick={() => onDelete(task.id)}
                className="text-gray-400 hover:text-red-600"
                aria-label="Delete task"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">

            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                Task Details
              </h2>

              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-red-600"
                aria-label="Close details"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="font-semibold text-gray-800">
                  {selectedTask.title}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-800">
                  {selectedTask.description || "No description"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded-md text-xs font-semibold ${
                    priorityStyles[selectedTask.priority] ||
                    priorityStyles.Medium
                  }`}
                >
                  {selectedTask.priority || "Medium"}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium text-purple-600">
                  {selectedTask.category || "Personal"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="text-gray-800">
                  {selectedTask.due_date ||
                    selectedTask.dueDate ||
                    "Not set"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-gray-800">
                  {selectedTask.completed
                    ? "Completed"
                    : "Pending"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="w-full mt-6 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
