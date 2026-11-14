
"use client";

import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import { useEffect, useState } from "react";

import { CalendarRange, CheckCircle, Circle } from "lucide-react";

import { useRouter } from "next/navigation";

export default function WeeklyChecks() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [completionIds, setCompletionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekDates, setWeekDates] = useState([]);
  const [taskView, setTaskView] = useState("all");
  const [updatingIds, setUpdatingIds] = useState([]);

  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Format date as YYYY-MM-DD using local time
  function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Load weekly tasks
  useEffect(() => {
    let ignore = false;

    async function loadWeeklyTasks() {
      try {
        const today = new Date();
        const start = new Date(today);

        start.setHours(0, 0, 0, 0);
        start.setDate(today.getDate() - today.getDay());

        const dates = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(start);
          date.setDate(start.getDate() + index);
          return getDateString(date);
        });

        if (!ignore) {
          setWeekDates(dates);
        }

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

        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (taskError) throw taskError;

        const weeklyTasks = (taskData || []).filter((task) => {
          if (task.recurrence_type === "Daily") return true;
          if (task.recurrence_type === "Weekly") return true;

          return (
            task.due_date &&
            task.due_date >= startDate &&
            task.due_date <= endDate
          );
        });

        const { data: completionData, error: completionError } =
          await supabase
            .from("task_completions")
            .select("task_id, completed_for")
            .eq("user_id", user.id)
            .gte("completed_for", startDate)
            .lte("completed_for", endDate);

        if (completionError) throw completionError;

        if (!ignore) {
          setTasks(weeklyTasks);
          setCompletionIds(completionData || []);
        }
      } catch (error) {
        console.error("Weekly Checks error:", error);

        if (!ignore) {
          alert(error.message || "Unable to load weekly tasks.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadWeeklyTasks();

    return () => {
      ignore = true;
    };
  }, [router]);

  // Get tasks scheduled for a particular day
  function getTasksForDay(date, dayIndex) {
    return tasks.filter((task) => {
      if (task.recurrence_type === "Daily") return true;

      if (task.recurrence_type === "Weekly") {
        return (task.recurrence_days || []).includes(dayIndex);
      }

      return task.due_date === date;
    });
  }

  // Check whether a task occurrence is completed
  function isTaskCompleted(taskId, date) {
    return completionIds.some(
      (item) =>
        item.task_id === taskId &&
        item.completed_for === date
    );
  }

  // Mark complete or pending
  async function toggleCompletion(taskId, date) {
    const updateKey = `${taskId}-${date}`;

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

      const alreadyCompleted = isTaskCompleted(taskId, date);

      if (alreadyCompleted) {
        // Undo completion for this date
        const { error } = await supabase
          .from("task_completions")
          .delete()
          .eq("task_id", taskId)
          .eq("user_id", user.id)
          .eq("completed_for", date);

        if (error) throw error;

        setCompletionIds((previous) =>
          previous.filter(
            (item) =>
              !(
                item.task_id === taskId &&
                item.completed_for === date
              )
          )
        );
      } else {
        // Mark completion for this date
        const { error } = await supabase
          .from("task_completions")
          .insert({
            task_id: taskId,
            user_id: user.id,
            completed_for: date,
          });

        if (error) throw error;

        setCompletionIds((previous) => [
          ...previous,
          {
            task_id: taskId,
            completed_for: date,
          },
        ]);
      }
    } catch (error) {
      alert("Unable to update task: " + error.message);
    } finally {
      setUpdatingIds((previous) =>
        previous.filter((id) => id !== updateKey)
      );
    }
  }

  // Calculate weekly progress
  const totalOccurrences = weekDates.reduce(
    (total, date, index) =>
      total + getTasksForDay(date, index).length,
    0
  );

  const completedOccurrences = completionIds.filter((item) => {
    const dayIndex = new Date(
      `${item.completed_for}T12:00:00`
    ).getDay();

    return getTasksForDay(
      item.completed_for,
      dayIndex
    ).some((task) => task.id === item.task_id);
  }).length;

  const pendingOccurrences =
    totalOccurrences - completedOccurrences;

  const progress =
    totalOccurrences === 0
      ? 0
      : Math.round(
          (completedOccurrences / totalOccurrences) * 100
        );

  // Filter occurrences for All, Pending, Completed
  const visibleOccurrences = weekDates.flatMap(
    (date, index) => {
      return getTasksForDay(date, index)
        .filter((task) => {
          const completed = isTaskCompleted(task.id, date);

          if (taskView === "completed") return completed;
          if (taskView === "pending") return !completed;

          return true;
        })
        .map((task) => ({
          task,
          date,
          dayIndex: index,
        }));
    }
  );

  const allCount = totalOccurrences;
  const completedCount = completedOccurrences;
  const pendingCount = pendingOccurrences;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <Header />

        <div className="mt-8">
          {/* Heading */}
          <div className="flex items-center gap-3 mb-6">
            <CalendarRange
              className="text-purple-600"
              size={30}
            />

            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Weekly Checks
              </h1>

              <p className="text-gray-500 dark:text-gray-400">
                Track your progress throughout this week.
              </p>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex justify-between mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Weekly Progress
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
                  {allCount}
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

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setTaskView("all")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                taskView === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
              }`}
            >
              All Tasks ({allCount})
            </button>

            <button
              onClick={() => setTaskView("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                taskView === "pending"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
              }`}
            >
              Pending ({pendingCount})
            </button>

            <button
              onClick={() => setTaskView("completed")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                taskView === "completed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Weekly Task List */}
          {loading ? (
            <p className="text-gray-500 dark:text-gray-300">
              Loading weekly tasks...
            </p>
          ) : visibleOccurrences.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <CalendarRange
                size={40}
                className="mx-auto text-gray-400 mb-3"
              />

              <p className="text-gray-500 dark:text-gray-400">
                {taskView === "completed"
                  ? "No completed tasks this week."
                  : taskView === "pending"
                  ? "No pending tasks. Great work!"
                  : "No tasks scheduled this week."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {weekDates.map((date, index) => {
                const dayTasks = getTasksForDay(date, index).filter(
                  (task) => {
                    const completed = isTaskCompleted(task.id, date);

                    if (taskView === "completed") return completed;
                    if (taskView === "pending") return !completed;

                    return true;
                  }
                );

                // Hide days with no matching tasks in filtered views
                if (dayTasks.length === 0) return null;

                return (
                  <section
                    key={date}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-gray-800 dark:text-white">
                        {weekdays[index]}
                      </h2>

                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {date}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {dayTasks.map((task) => {
                        const isCompleted = isTaskCompleted(
                          task.id,
                          date
                        );

                        const updateKey = `${task.id}-${date}`;
                        const isUpdating = updatingIds.includes(updateKey);

                        return (
                          <div
                            key={`${task.id}-${date}`}
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t border-gray-100 dark:border-gray-700 pt-3"
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle
                                  className="text-green-500 shrink-0"
                                  size={20}
                                />
                              ) : (
                                <Circle
                                  className="text-gray-400 shrink-0"
                                  size={20}
                                />
                              )}

                              <div>
                                <span
                                  className={`font-medium ${
                                    isCompleted
                                      ? "line-through text-gray-400"
                                      : "text-gray-700 dark:text-gray-200"
                                  }`}
                                >
                                  {task.title}
                                </span>

                                {task.category && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {task.category}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleCompletion(task.id, date)
                              }
                              disabled={isUpdating}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                isCompleted
                                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                  : "bg-purple-600 text-white hover:bg-purple-700"
                              }`}
                            >
                              {isUpdating
                                ? "Updating..."
                                : isCompleted
                                ? "Mark Pending"
                                : "Mark Complete"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
