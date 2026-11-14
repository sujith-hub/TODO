
"use client";

import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
} from "lucide-react";

export default function MonthlyChecks() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [updatingIds, setUpdatingIds] = useState([]);
  const [monthLabel, setMonthLabel] = useState("");

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    let ignore = false;

    async function fetchMonthlyTasks() {
      setLoading(true);

      try {
        const today = new Date();

        const firstDay = new Date(
          today.getFullYear(),
          today.getMonth() + monthOffset,
          1
        );

        const year = firstDay.getFullYear();
        const month = firstDay.getMonth();
        const lastDay = new Date(year, month + 1, 0);

        const startDate = formatDate(firstDay);
        const endDate = formatDate(lastDay);

        const monthDates = [];

        for (let day = 1; day <= lastDay.getDate(); day++) {
          monthDates.push(formatDate(new Date(year, month, day)));
        }

        const label = firstDay.toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        });

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: taskData, error: taskError } =
          await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true);

        if (taskError) throw taskError;

        const { data: completionData, error: completionError } =
          await supabase
            .from("task_completions")
            .select("task_id, completed_for")
            .eq("user_id", user.id)
            .gte("completed_for", startDate)
            .lte("completed_for", endDate);

        if (completionError) throw completionError;

        if (!ignore) {
          setTasks(taskData || []);
          setCompletions(completionData || []);
          setDates(monthDates);
          setMonthLabel(label);

          const currentDate = formatDate(today);
          setSelectedDate(
            monthDates.includes(currentDate)
              ? currentDate
              : monthDates[0]
          );
        }
      } catch (error) {
        console.error("Monthly Checks error:", error);
        alert("Unable to load monthly tasks: " + error.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchMonthlyTasks();

    return () => {
      ignore = true;
    };
  }, [router, monthOffset]);

  function isRecurring(task) {
    return (
      task.is_recurring ||
      (task.recurrence_type &&
        task.recurrence_type !== "None")
    );
  }

  function getTasksForDate(date) {
    if (!date) return [];

    const selected = new Date(date + "T00:00:00");
    const dayOfWeek = selected.getDay();
    const dayOfMonth = selected.getDate();

    return tasks.filter((task) => {
      if (task.recurrence_type === "Daily") {
        return true;
      }

      if (task.recurrence_type === "Weekly") {
        return (task.recurrence_days || []).includes(dayOfWeek);
      }

      if (task.recurrence_type === "Monthly") {
        if (!task.due_date) return false;

        const originalDay = Number(task.due_date.split("-")[2]);
        const lastDay = new Date(
          selected.getFullYear(),
          selected.getMonth() + 1,
          0
        ).getDate();

        return dayOfMonth === Math.min(originalDay, lastDay);
      }

      return task.due_date === date;
    });
  }

  function isCompleted(task, date) {
    if (isRecurring(task)) {
      return completions.some(
        (item) =>
          item.task_id === task.id &&
          item.completed_for === date
      );
    }

    return task.completed === true;
  }

  async function toggleCompletion(task, date) {
    const key = `${task.id}-${date}`;

    if (updatingIds.includes(key)) return;

    setUpdatingIds((previous) => [...previous, key]);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const completed = isCompleted(task, date);

      if (isRecurring(task)) {
        if (completed) {
          const { error } = await supabase
            .from("task_completions")
            .delete()
            .eq("task_id", task.id)
            .eq("user_id", user.id)
            .eq("completed_for", date);

          if (error) throw error;

          setCompletions((previous) =>
            previous.filter(
              (item) =>
                !(
                  item.task_id === task.id &&
                  item.completed_for === date
                )
            )
          );
        } else {
          const { error } = await supabase
            .from("task_completions")
            .insert({
              task_id: task.id,
              user_id: user.id,
              completed_for: date,
            });

          if (error) throw error;

          setCompletions((previous) => [
            ...previous,
            {
              task_id: task.id,
              completed_for: date,
            },
          ]);
        }
      } else {
        const { error } = await supabase
          .from("tasks")
          .update({ completed: !completed })
          .eq("id", task.id)
          .eq("user_id", user.id);

        if (error) throw error;

        setTasks((previous) =>
          previous.map((item) =>
            item.id === task.id
              ? { ...item, completed: !completed }
              : item
          )
        );
      }
    } catch (error) {
      alert("Unable to update task: " + error.message);
    } finally {
      setUpdatingIds((previous) =>
        previous.filter((item) => item !== key)
      );
    }
  }

  const selectedTasks = getTasksForDate(selectedDate);

  const completedCount = selectedTasks.filter((task) =>
    isCompleted(task, selectedDate)
  ).length;

  const pendingCount = selectedTasks.length - completedCount;

  const progress =
    selectedTasks.length === 0
      ? 0
      : Math.round(
          (completedCount / selectedTasks.length) * 100
        );

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 min-w-0 p-4 md:p-8">
        {/* Heading */}
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={28} className="text-purple-600" />

          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Monthly Checks
          </h1>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Select a date to view and update your tasks.
        </p>

        {loading ? (
          <p className="text-purple-600">
            Loading monthly tasks...
          </p>
        ) : (
          <>
            {/* Month Navigation */}
            <div className="flex justify-between items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
              <button
                onClick={() => setMonthOffset((prev) => prev - 1)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white"
              >
                <ChevronLeft size={20} />
              </button>

              <h2 className="font-bold text-gray-800 dark:text-white">
                {monthLabel}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMonthOffset(0)}
                  className="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm"
                >
                  Today
                </button>

                <button
                  onClick={() => setMonthOffset((prev) => prev + 1)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Date Dropdown */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Select Date
              </label>

              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full md:w-80 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              >
                {dates.map((date) => {
                  const day = new Date(date + "T00:00:00");

                  return (
                    <option key={date} value={date}>
                      {day.toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Date Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-4">
                {selectedDate
                  ? new Date(
                      selectedDate + "T00:00:00"
                    ).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Select a date"}
              </h2>

              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Daily Progress
                </span>

                <span className="font-bold text-purple-600">
                  {progress}%
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {selectedTasks.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-bold text-orange-500">
                    {pendingCount}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pending
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {completedCount}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Completed
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Date Tasks */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Tasks for Selected Date
              </h2>

              {selectedTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No tasks scheduled for this date.
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedTasks.map((task) => {
                    const completed = isCompleted(
                      task,
                      selectedDate
                    );

                    const key = `${task.id}-${selectedDate}`;
                    const updating = updatingIds.includes(key);

                    return (
                      <div
                        key={task.id}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          {completed ? (
                            <CheckCircle
                              size={21}
                              className="text-green-500 mt-1"
                            />
                          ) : (
                            <Circle
                              size={21}
                              className="text-orange-500 mt-1"
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
                              <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
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
                            {completed ? "Completed" : "Pending"}
                          </span>

                          <button
                            onClick={() =>
                              toggleCompletion(task, selectedDate)
                            }
                            disabled={updating}
                            className={`px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                              completed
                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                : "bg-purple-600 text-white hover:bg-purple-700"
                            }`}
                          >
                            {updating
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
            </div>
          </>
        )}
      </main>
    </div>
  );
}
