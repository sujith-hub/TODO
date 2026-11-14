
"use client";

import { useState } from "react";

import { Plus, X, Repeat } from "lucide-react";

const categories = [
  "Home",
  "Personal Care",
  "Health Care",
  "Skin Care",
  "Job Skills",
  "Learning",
  "Business",
  "Family",
  "Work",
  "Study",
  "Shopping",
  "Personal",
];

const weekdays = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export default function AddTask({ onAdd }) {
  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Personal");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("None");
  const [recurrenceDays, setRecurrenceDays] = useState([]);

  function toggleDay(day) {
    setRecurrenceDays((previous) =>
      previous.includes(day)
        ? previous.filter((item) => item !== day)
        : [...previous, day].sort()
    );
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    if (recurrenceType === "Weekly" && recurrenceDays.length === 0) {
      alert("Please select at least one weekday");
      return;
    }

    if (
      recurrenceType === "Monthly" &&
      !dueDate
    ) {
      alert("Please select a due date for your monthly task");
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      dueDate,
      completed: false,
      recurrenceType,
      recurrenceDays:
        recurrenceType === "Weekly" ? recurrenceDays : [],
      isRecurring: recurrenceType !== "None",
    });

    setTitle("");
    setDescription("");
    setPriority("Medium");
    setCategory("Personal");
    setDueDate("");
    setRecurrenceType("None");
    setRecurrenceDays([]);
    setIsOpen(false);
  }

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-purple-500";

  const labelClass =
    "block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300";

  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-lg hover:bg-purple-700"
      >
        {isOpen ? <X size={20} /> : <Plus size={20} />}
        {isOpen ? "Close Form" : "Add New Task"}
      </button>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mt-5 space-y-5 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Create New Task
          </h2>

          <div>
            <label className={labelClass}>Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows="3"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={inputClass}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <Repeat size={15} className="inline mr-1" />
                Repeat Task
              </label>

              <select
                value={recurrenceType}
                onChange={(e) => {
                  setRecurrenceType(e.target.value);
                  setRecurrenceDays([]);
                }}
                className={inputClass}
              >
                <option value="None">No Repeat</option>
                <option value="Daily">Every Day</option>
                <option value="Weekly">Every Week</option>
                <option value="Monthly">Every Month</option>
              </select>
            </div>
          </div>

          {recurrenceType === "Weekly" && (
            <div>
              <label className={labelClass}>
                Select Repeat Days
              </label>

              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                      recurrenceDays.includes(day.value)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurrenceType !== "None" && (
            <p className="text-sm text-purple-600 dark:text-purple-400">
              This task will repeat{" "}
              {recurrenceType === "Daily"
                ? "every day."
                : recurrenceType === "Weekly"
                ? "on your selected weekdays."
                : "every month on the selected due-date day."}
            </p>
          )}

          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Save Task
          </button>
        </form>
      )}
    </div>
  );
}
