
"use client";

import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(start, end) {
  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function isRecurring(task) {
  const recurrence = task.recurrence_type || "None";
  return recurrence !== "None";
}

function isScheduled(task, date) {
  const dateString = formatDate(date);
  const recurrence = task.recurrence_type || "None";
  const dueDate = task.due_date;

  if (task.created_at) {
    const createdDate = new Date(task.created_at);
    createdDate.setHours(0, 0, 0, 0);

    if (date < createdDate) return false;
  }

  if (recurrence === "Daily") return true;

  if (recurrence === "Weekly") {
    return (task.recurrence_days || []).includes(date.getDay());
  }

  if (recurrence === "Monthly") {
    if (!dueDate) return false;

    const desiredDay = Number(dueDate.split("-")[2]);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    return date.getDate() === Math.min(desiredDay, lastDay);
  }

  return dueDate === dateString;
}

export default function TaskAnalytics({ tasks }) {
  const [completionHistory, setCompletionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("Daily");

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      setLoading(true);

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("task_completions")
        .select("task_id, completed_for")
        .gte("completed_for", formatDate(start))
        .lte("completed_for", formatDate(end));

      if (!mounted) return;

      if (error) {
        console.error(error.message);
        setCompletionHistory([]);
      } else {
        setCompletionHistory(data || []);
      }

      setLoading(false);
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [tasks]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  function getCounts(date) {
    const dateString = formatDate(date);

    const scheduled = tasks.filter((task) => isScheduled(task, date));

    let completed = 0;

    scheduled.forEach((task) => {
      if (isRecurring(task)) {
        const found = completionHistory.some(
          (item) =>
            item.task_id === task.id &&
            item.completed_for === dateString
        );

        if (found) completed++;
      } else if (task.completed) {
        completed++;
      }
    });

    return {
      Completed: completed,
      Pending: Math.max(0, scheduled.length - completed),
    };
  }

  const dailyCounts = getCounts(today);

  const dailyData = [
    {
      day: "Today",
      ...dailyCounts,
    },
  ];

  const weeklyData = getDateRange(weekStart, weekEnd).map((date) => ({
    day: date.toLocaleDateString("en-IN", { weekday: "short" }),
    ...getCounts(date),
  }));

  const monthlyData = getDateRange(monthStart, monthEnd).map((date) => ({
    day: String(date.getDate()),
    ...getCounts(date),
  }));

  const chartData =
    period === "Daily"
      ? dailyData
      : period === "Weekly"
      ? weeklyData
      : monthlyData;

  const totalCompleted = chartData.reduce(
    (sum, item) => sum + item.Completed,
    0
  );

  const totalPending = chartData.reduce(
    (sum, item) => sum + item.Pending,
    0
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl mb-8">
        Loading task analytics...
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Task Analytics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View your task progress
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white outline-none"
        >
          <option value="Daily">Daily Tasks</option>
          <option value="Weekly">Weekly Tasks</option>
          <option value="Monthly">Monthly Tasks</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Completed
          </p>
          <p className="text-2xl font-bold text-green-600">
            {totalCompleted}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Pending
          </p>
          <p className="text-2xl font-bold text-orange-600">
            {totalPending}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="Completed"
            fill="#16a34a"
            radius={[5, 5, 0, 0]}
          />
          <Bar
            dataKey="Pending"
            fill="#f97316"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
