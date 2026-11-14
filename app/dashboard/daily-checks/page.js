
"use client";

import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  CheckCircle,
  Circle,
  CalendarCheck,
} from "lucide-react";

export default function DailyChecks() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [taskView, setTaskView] = useState("all");

  // Get today's date
  const getToday = useCallback(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  // Fetch today's tasks
  const fetchDailyTasks = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    const today = getToday();

    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (taskError) {
      alert(taskError.message);
      setLoading(false);
      return;
    }

    const dailyTasks = (taskData || []).filter((task) => {
      if (task.recurrence_type === "Daily") {
        return true;
      }

      if (task.recurrence_type === "Weekly") {
        const weekdays = task.recurrence_days || [];

        return weekdays.includes(
          new Date(`${today}T12:00:00`).getDay()
        );
      }

      if (task.recurrence_type === "Monthly") {
        return task.due_date === today;
      }

      return task.due_date === today;
    });

    const { data: completionData, error: completionError } =
      await supabase
        .from("task_completions")
        .select("task_id")
        .eq("user_id", user.id)
        .eq("completed_for", today);

    if (completionError) {
      alert(completionError.message);
      setLoading(false);
      return;
    }

    setTasks(dailyTasks);

    setCompletedIds(
      (completionData || []).map((item) => item.task_id)
    );

    setLoading(false);
  }, [getToday, router]);

  useEffect(() => {
    fetchDailyTasks();
  }, [fetchDailyTasks]);

  // Mark complete or pending
  async function toggleCompletion(taskId) {
    if (updatingIds.includes(taskId)) return;

    setUpdatingIds((prev) => [...prev, taskId]);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setUpdatingIds((prev) =>
        prev.filter((id) => id !== taskId)
      );

      router.replace("/login");
      return;
    }

    const today = getToday();
    const isCompleted = completedIds.includes(taskId);

    if (isCompleted) {
      // Undo completion
      const { error } = await supabase
        .from("task_completions")
        .delete()
        .eq("task_id", taskId)
        .eq("user_id", user.id)
        .eq("completed_for", today);

      if (error) {
        alert("Unable to undo completion: " + error.message);
      } else {
        setCompletedIds((prev) =>
          prev.filter((id) => id !== taskId)
        );
      }
    } else {
      // Mark task complete
      const { error } = await supabase
        .from("task_completions")
        .insert({
          task_id: taskId,
          user_id: user.id,
          completed_for: today,
        });

      if (error) {
        alert("Unable to mark task complete: " + error.message);
      } else {
        setCompletedIds((prev) => [...prev, taskId]);
      }
    }

    setUpdatingIds((prev) =>
      prev.filter((id) => id !== taskId)
    );
  }

  // Counts
  const completedCount = tasks.filter((task) =>
    completedIds.includes(task.id)
  ).length;

  const pendingCount = tasks.length - completedCount;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  // Filter tasks based on selected button
  const visibleTasks = tasks.filter((task) => {
    const isCompleted = completedIds.includes(task.id);

    if (taskView === "completed") return isCompleted;
    if (taskView === "pending") return !isCompleted;

    return true;
  });

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <Header />

        <div className="mt-6">
          {/* Page Heading */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
              <CalendarCheck className="text-blue-600 dark:text-blue-300" size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Daily Checks
              </h1>

              <p className="text-gray-500 dark:text-gray-400">
                Track your daily tasks and progress.
              </p>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800 dark:text-white">
                Today's Progress
              </h2>

              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {progress}%
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {tasks.length}
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
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
              }`}
            >
              All Tasks ({tasks.length})
            </button>

            <button
              onClick={() => setTaskView("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                taskView === "pending"
                  ? "bg-blue-600 text-white"
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

          {/* Task List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
              {taskView === "all"
                ? "All Today's Tasks"
                : taskView === "pending"
                ? "Pending Tasks"
                : "Completed Tasks"}
            </h2>

            {loading ? (
              <p className="text-center text-gray-500 py-8">
                Loading tasks...
              </p>
            ) : visibleTasks.length === 0 ? (
              <div className="text-center py-10">
                <CalendarCheck
                  size={40}
                  className="mx-auto text-gray-400 mb-3"
                />

                <p className="text-gray-500 dark:text-gray-400">
                  {taskView === "completed"
                    ? "No completed tasks yet."
                    : taskView === "pending"
                    ? "No pending tasks. Great work!"
                    : "No tasks scheduled for today."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleTasks.map((task) => {
                  const isCompleted = completedIds.includes(task.id);
                  const isUpdating = updatingIds.includes(task.id);

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        {isCompleted ? (
                          <CheckCircle
                            className="text-green-500 mt-1 shrink-0"
                            size={22}
                          />
                        ) : (
                          <Circle
                            className="text-gray-400 mt-1 shrink-0"
                            size={22}
                          />
                        )}

                        <div>
                          <h3
                            className={`font-semibold ${
                              isCompleted
                                ? "text-gray-400 line-through"
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

                          <div className="flex flex-wrap gap-2 mt-2">
                            {task.category && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {task.category}
                              </span>
                            )}

                            {task.priority && (
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  task.priority === "High"
                                    ? "bg-red-100 text-red-700"
                                    : task.priority === "Medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {task.priority} Priority
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleCompletion(task.id)}
                        disabled={isUpdating}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          isCompleted
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-green-600 text-white hover:bg-green-700"
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
