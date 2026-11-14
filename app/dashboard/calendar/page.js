
"use client";

import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
} from "lucide-react";

export default function CalendarPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [completionIds, setCompletionIds] = useState([]);
  const [weekDates, setWeekDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Format date as YYYY-MM-DD
  function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Load tasks and completion history for the selected week
  useEffect(() => {
    let ignore = false;

    async function fetchCalendarTasks() {
      setLoading(true);

      try {
        const today = new Date();
        const start = new Date(today);

        start.setHours(0, 0, 0, 0);
        start.setDate(
          today.getDate() - today.getDay() + weekOffset * 7
        );

        const dates = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(start);
          date.setDate(start.getDate() + index);
          return getDateString(date);
        });

        const startDate = dates[0];
        const endDate = dates[6];

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;

        if (!user) {
          router.replace("/login");
          return;
        }

        // Fetch active tasks
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (taskError) throw taskError;

        // Fetch completion history for this week
        const { data: completionData, error: completionError } =
          await supabase
            .from("task_completions")
            .select("task_id, completed_for")
            .eq("user_id", user.id)
            .gte("completed_for", startDate)
            .lte("completed_for", endDate);

        if (completionError) throw completionError;

        if (!ignore) {
          setWeekDates(dates);
          setTasks(taskData || []);
          setCompletionIds(completionData || []);
        }
      } catch (error) {
        console.error("Calendar error:", error);

        if (!ignore) {
          alert(error.message || "Unable to load calendar.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchCalendarTasks();

    return () => {
      ignore = true;
    };
  }, [router, weekOffset]);

  // Check whether a task is recurring
  function isRecurringTask(task) {
    return (
      task.is_recurring ||
      (task.recurrence_type &&
        task.recurrence_type !== "None")
    );
  }

  // Get tasks scheduled for a particular date
  function getTasksForDay(date, dayIndex) {
    return tasks.filter((task) => {
      if (task.recurrence_type === "Daily") {
        return true;
      }

      if (task.recurrence_type === "Weekly") {
        return (task.recurrence_days || []).includes(dayIndex);
      }

      // Monthly and normal tasks appear on their due date
      return task.due_date === date;
    });
  }

  // Check completion status for a particular date
  function isTaskCompleted(task, date) {
    if (isRecurringTask(task)) {
      return completionIds.some(
        (item) =>
          item.task_id === task.id &&
          item.completed_for === date
      );
    }

    return task.completed === true;
  }

  // Toggle task completion
  async function toggleCompletion(task, date) {
    const updateKey = `${task.id}-${date}`;

    if (updatingIds.includes(updateKey)) return;

    setUpdatingIds((previous) => [...previous, updateKey]);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const alreadyCompleted = isTaskCompleted(task, date);

      if (isRecurringTask(task)) {
        if (alreadyCompleted) {
          // Remove completion for this particular date
          const { error } = await supabase
            .from("task_completions")
            .delete()
            .eq("task_id", task.id)
            .eq("user_id", user.id)
            .eq("completed_for", date);

          if (error) throw error;

          setCompletionIds((previous) =>
            previous.filter(
              (item) =>
                !(
                  item.task_id === task.id &&
                  item.completed_for === date
                )
            )
          );
        } else {
          // Save completion for this particular date
          const { error } = await supabase
            .from("task_completions")
            .insert({
              task_id: task.id,
              user_id: user.id,
              completed_for: date,
            });

          if (error) throw error;

          setCompletionIds((previous) => [
            ...previous,
            {
              task_id: task.id,
              completed_for: date,
            },
          ]);
        }
      } else {
        // Normal task: update tasks table
        const { error } = await supabase
          .from("tasks")
          .update({
            completed: !alreadyCompleted,
          })
          .eq("id", task.id)
          .eq("user_id", user.id);

        if (error) throw error;

        setTasks((previous) =>
          previous.map((item) =>
            item.id === task.id
              ? { ...item, completed: !alreadyCompleted }
              : item
          )
        );
      }
    } catch (error) {
      alert("Unable to update task: " + error.message);
    } finally {
      setUpdatingIds((previous) =>
        previous.filter((id) => id !== updateKey)
      );
    }
  }

  // Calculate weekly counts
  const totalOccurrences = weekDates.reduce(
    (total, date, index) =>
      total + getTasksForDay(date, index).length,
    0
  );

  const completedOccurrences = weekDates.reduce(
    (total, date, index) => {
      const dayTasks = getTasksForDay(date, index);

      return (
        total +
        dayTasks.filter((task) =>
          isTaskCompleted(task, date)
        ).length
      );
    },
    0
  );

  const pendingOccurrences =
    totalOccurrences - completedOccurrences;

  const progress =
    totalOccurrences === 0
      ? 0
      : Math.round(
          (completedOccurrences / totalOccurrences) * 100
        );

  // Display selected week
  const weekLabel =
    weekDates.length === 7
      ? `${weekDates[0]} to ${weekDates[6]}`
      : "";

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 min-w-0 p-4 md:p-8">
        {/* Heading */}
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays
            size={28}
            className="text-purple-600"
          />

          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Calendar
          </h1>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          View and update your daily, weekly, and recurring tasks.
        </p>

        {/* Week Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="text-center">
            <h2 className="font-semibold text-gray-800 dark:text-white">
              {weekOffset === 0
                ? "This Week"
                : weekOffset === 1
                ? "Next Week"
                : weekOffset === -1
                ? "Last Week"
                : "Selected Week"}
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {weekLabel}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm"
            >
              Today
            </button>

            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-purple-600">
            Loading calendar...
          </p>
        ) : (
          <>
            {/* Weekly Progress */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  Weekly Progress
                </h2>

                <span className="font-bold text-purple-600">
                  {progress}%
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {totalOccurrences}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-bold text-orange-500">
                    {pendingOccurrences}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pending
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {completedOccurrences}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Completed
                  </p>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={17} className="text-green-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  Completed
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Circle size={17} className="text-orange-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  Pending
                </span>
              </div>
            </div>

            {/* Calendar Days */}
            <div className="space-y-4">
              {weekDates.map((date, index) => {
                const dayTasks = getTasksForDay(date, index);

                const dayCompleted = dayTasks.filter((task) =>
                  isTaskCompleted(task, date)
                ).length;

                const dayPending =
                  dayTasks.length - dayCompleted;

                return (
                  <section
                    key={date}
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                    {/* Day Heading */}
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                      <div>
                        <h2 className="font-bold text-gray-800 dark:text-white">
                          {weekdays[index]}
                        </h2>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {date}
                        </p>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                          Completed: {dayCompleted}
                        </span>

                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Pending: {dayPending}
                        </span>
                      </div>
                    </div>

                    {/* Tasks */}
                    {dayTasks.length === 0 ? (
                      <p className="text-sm text-gray-400 py-3">
                        No tasks scheduled for this day.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dayTasks.map((task) => {
                          const completed = isTaskCompleted(
                            task,
                            date
                          );

                          const updateKey = `${task.id}-${date}`;
                          const isUpdating =
                            updatingIds.includes(updateKey);

                          return (
                            <div
                              key={task.id}
                              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t border-gray-100 dark:border-gray-700 pt-3"
                            >
                              <div className="flex items-start gap-3">
                                {completed ? (
                                  <CheckCircle
                                    className="text-green-500 mt-1 shrink-0"
                                    size={21}
                                  />
                                ) : (
                                  <Circle
                                    className="text-orange-500 mt-1 shrink-0"
                                    size={21}
                                  />
                                )}

                                <div>
                                  <h3
                                    className={`font-semibold ${
                                      completed
                                        ? "line-through text-gray-400"
                                        : "text-gray-800 dark:text-white"
                                    }`}
                                  >
                                    {task.title}
                                  </h3>

                                  {task.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      {task.description}
                                    </p>
                                  )}

                                  {task.category && (
                                    <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mt-2">
                                      {task.category}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-xs px-3 py-1 rounded-full ${
                                    completed
                                      ? "bg-green-100 text-green-700"
                                      : "bg-orange-100 text-orange-700"
                                  }`}
                                >
                                  {completed
                                    ? "Completed"
                                    : "Pending"}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleCompletion(task, date)
                                  }
                                  disabled={isUpdating}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                                    completed
                                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                      : "bg-purple-600 text-white hover:bg-purple-700"
                                  }`}
                                >
                                  {isUpdating
                                    ? "Updating..."
                                    : completed
                                    ? "Mark Pending"
                                    : "Mark Complete"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
