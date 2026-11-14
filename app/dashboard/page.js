
"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TaskStats from "@/components/TaskStats";
import TaskAnalytics from "@/components/TaskAnalytics";
import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";
import { supabase } from "@/lib/supabase";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

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

const weekDays = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export default function Dashboard() {
  const router = useRouter();

  // Task states
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [authChecking, setAuthChecking] = useState(true);

  // Format database task for frontend
  function formatTask(task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Medium",
      category: task.category || "Personal",
      dueDate: task.due_date || "",
      completed: task.completed || false,
      recurrenceType: task.recurrence_type || "None",
      recurrenceDays: task.recurrence_days || [],
      isRecurring: task.is_recurring || false,
      createdAt: task.created_at || "",
    };
  }

  // Authentication and fetch tasks
  useEffect(() => {
    let mounted = true;

    async function initializeDashboard() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        router.replace("/login");
        return;
      }

      const user = data.session.user;

      const { data: savedTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (tasksError) {
        console.error("Fetch error:", tasksError.message);
        alert("Unable to load tasks: " + tasksError.message);
      } else {
        setTasks((savedTasks || []).map(formatTask));
      }

      setAuthChecking(false);
    }

    initializeDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Add task to Supabase
  async function addTask(newTask) {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          user_id: user.id,
          title: newTask.title,
          description: newTask.description || "",
          priority: newTask.priority || "Medium",
          category: newTask.category || "Personal",
          due_date: newTask.dueDate || null,
          completed: false,
          recurrence_type: newTask.recurrenceType || "None",
          recurrence_days: newTask.recurrenceDays || [],
          is_recurring: newTask.isRecurring || false,
          is_active: true,
          next_due_date: newTask.dueDate || null,
        },
      ])
      .select()
      .single();

    if (error) {
      alert("Unable to save task: " + error.message);
      return;
    }

    setTasks((previousTasks) => [
      formatTask(data),
      ...previousTasks,
    ]);
  }

  // Get today's date in local YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Format date as YYYY-MM-DD
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Calculate next recurring date
  function getNextDueDate(task, completedDate) {
    const [year, month, day] = completedDate.split("-").map(Number);

    if (task.recurrenceType === "Daily") {
      return formatDate(new Date(year, month - 1, day + 1));
    }

    if (task.recurrenceType === "Weekly") {
      const selectedDays = task.recurrenceDays || [];

      if (selectedDays.length === 0) {
        return formatDate(new Date(year, month - 1, day + 7));
      }

      for (let offset = 1; offset <= 7; offset++) {
        const next = new Date(year, month - 1, day + offset);

        if (selectedDays.includes(next.getDay())) {
          return formatDate(next);
        }
      }
    }

    if (task.recurrenceType === "Monthly") {
      const nextMonth = new Date(year, month, 1);

      const lastDay = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        0
      ).getDate();

      nextMonth.setDate(Math.min(day, lastDay));

      return formatDate(nextMonth);
    }

    return null;
  }

  // Toggle task completion
  async function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);

    if (!task) return;

    const today = getTodayDate();

    // Uncheck a completed task
    if (task.completed) {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: false })
        .eq("id", id);

      if (error) {
        alert("Unable to update task: " + error.message);
        return;
      }

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === id
            ? { ...item, completed: false }
            : item
        )
      );

      return;
    }

    // Recurring task completion
    if (task.isRecurring && task.recurrenceType !== "None") {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: historyError } = await supabase
        .from("task_completions")
        .insert({
          task_id: id,
          user_id: user.id,
          completed_for: today,
        });

      if (historyError) {
        alert("Unable to save completion history: " + historyError.message);
        return;
      }

      const nextDate = getNextDueDate(task, today);

      const { error } = await supabase
        .from("tasks")
        .update({
          completed: false,
          due_date: nextDate,
          next_due_date: nextDate,
        })
        .eq("id", id);

      if (error) {
        alert("Unable to schedule next task: " + error.message);
        return;
      }

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === id
            ? {
                ...item,
                completed: false,
                dueDate: nextDate,
              }
            : item
        )
      );

      alert("Task completed! Next occurrence scheduled.");
      return;
    }

    // Normal task completion
    const { error } = await supabase
      .from("tasks")
      .update({ completed: true })
      .eq("id", id);

    if (error) {
      alert("Unable to update task: " + error.message);
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.map((item) =>
        item.id === id
          ? { ...item, completed: true }
          : item
      )
    );
  }

  // Delete task
  async function deleteTask(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Unable to delete task: " + error.message);
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== id)
    );
  }

  // Open edit form
  function handleEdit(task) {
    setEditingTask({ ...task });
  }

  // Update task
  async function updateTask(e) {
    e.preventDefault();

    if (!editingTask.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        title: editingTask.title.trim(),
        description: editingTask.description || "",
        priority: editingTask.priority,
        category: editingTask.category || "Personal",
        due_date: editingTask.dueDate || null,
        recurrence_type: editingTask.recurrenceType || "None",
        recurrence_days: editingTask.recurrenceDays || [],
        is_recurring: editingTask.isRecurring || false,
      })
      .eq("id", editingTask.id);

    if (error) {
      alert("Unable to update task: " + error.message);
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === editingTask.id
          ? { ...editingTask }
          : task
      )
    );

    setEditingTask(null);
  }

  // Search, status, priority and category filtering
  const filteredTasks = tasks.filter((task) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(search) ||
      (task.description || "").toLowerCase().includes(search);

    const matchesStatus =
      filter === "All" ||
      (filter === "Pending" && !task.completed) ||
      (filter === "Completed" && task.completed);

    const matchesPriority =
      priorityFilter === "All" ||
      task.priority === priorityFilter;

    const matchesCategory =
      categoryFilter === "All" ||
      task.category === categoryFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesCategory
    );
  });

  // Sort tasks
  const priorityOrder = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority") {
      return (
        (priorityOrder[b.priority] || 0) -
        (priorityOrder[a.priority] || 0)
      );
    }

    if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return new Date(a.dueDate) - new Date(b.dueDate);
    }

    // Newest first: tasks are already fetched in created_at descending order.
    return 0;
  });

  // Loading screen
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg font-semibold text-purple-600">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <TaskStats tasks={tasks} />
        <TaskAnalytics tasks={tasks} />
        <AddTask onAdd={addTask} />

        {/* Edit Task Form */}
        {editingTask && (
          <form
            onSubmit={updateTask}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8 space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Task
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Task Title
              </label>

              <input
                type="text"
                value={editingTask.title}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    title: e.target.value,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Task title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Description
              </label>

              <textarea
                value={editingTask.description}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    description: e.target.value,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Description"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Priority
                </label>

                <select
                  value={editingTask.priority}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      priority: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Category
                </label>

                <select
                  value={editingTask.category || "Personal"}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      category: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Due Date
                </label>

                <input
                  type="date"
                  value={editingTask.dueDate || ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Repeat Task
                </label>

                <select
                  value={editingTask.recurrenceType || "None"}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      recurrenceType: e.target.value,
                      isRecurring: e.target.value !== "None",
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="None">No Repeat</option>
                  <option value="Daily">Every Day</option>
                  <option value="Weekly">Every Week</option>
                  <option value="Monthly">Every Month</option>
                </select>
              </div>
            </div>

            {/* Weekly Repeat Days */}
            {editingTask.recurrenceType === "Weekly" && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Repeat Days
                </label>

                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => {
                    const selectedDays =
                      editingTask.recurrenceDays || [];

                    const selected = selectedDays.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() =>
                          setEditingTask({
                            ...editingTask,
                            recurrenceDays: selected
                              ? selectedDays.filter(
                                  (item) => item !== day.value
                                )
                              : [...selectedDays, day.value].sort(),
                          })
                        }
                        className={`px-4 py-2 rounded-lg border text-sm ${
                          selected
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              My Tasks ({sortedTasks.length})
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              {["All", "Pending", "Completed"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filter === item
                      ? "bg-purple-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {item}
                </button>
              ))}

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="All">All Categories</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {/* Sorting */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="priority">High Priority First</option>
                <option value="dueDate">Earliest Due Date</option>
              </select>
              <button
  onClick={() => {
    setSearchTerm("");
    setFilter("All");
    setPriorityFilter("All");
    setCategoryFilter("All");
    setSortBy("newest");
  }}
  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
>
  Clear Filters
</button>
            </div>
          </div>

          <TaskList
            tasks={sortedTasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={handleEdit}
          />
        </section>
      </main>
    </div>
  );
}
