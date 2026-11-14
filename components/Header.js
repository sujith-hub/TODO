
"use client";

import { supabase } from "@/lib/supabase";

import { Search, Bell, UserCircle, X } from "lucide-react";

import { useEffect, useState } from "react";

export default function Header({
  searchTerm,
  onSearchChange,
  tasks = [],
}) {
  const [userName, setUserName] = useState("My Profile");
  const [userEmail, setUserEmail] = useState("");
  const [greeting, setGreeting] = useState("Hello");
  const [showNotifications, setShowNotifications] = useState(false);
  const [today, setToday] = useState("");

  // IST greeting and today's date
  useEffect(() => {
    function updateDateAndGreeting() {
      const now = new Date();

      const hour = Number(
        new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          hourCycle: "h23",
        }).format(now)
      );

      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good Evening");
      } else {
        setGreeting("Good Night");
      }

      const parts = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);

      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;

      if (year && month && day) {
        setToday(`${year}-${month}-${day}`);
      }
    }

    updateDateAndGreeting();

    const interval = setInterval(updateDateAndGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  // User profile
  useEffect(() => {
    async function getProfile() {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        setUserName(
          data.user.user_metadata?.full_name || "My Profile"
        );

        setUserEmail(data.user.email || "");
      }
    }

    getProfile();
  }, []);

  // Due today or overdue tasks
  const reminders = today
    ? tasks.filter((task) => {
        const dueDate = task.dueDate || task.due_date;

        if (task.completed || !dueDate) return false;

        return dueDate <= today;
      })
    : [];

  return (
    <header className="w-full min-w-0 mb-6 md:mb-8">
      {/* Greeting */}
      <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-5">
        {greeting}! Here's what's happening with your tasks today.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Search */}
        <div className="flex items-center w-full sm:flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
          <Search size={20} className="text-gray-400 shrink-0" />

          <input
            type="text"
            value={searchTerm || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search tasks..."
            className="w-full min-w-0 ml-3 outline-none bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-500"
          />
        </div>

        {/* Notifications and Profile */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowNotifications((prev) => !prev)
              }
              aria-label="Show reminders"
              aria-expanded={showNotifications}
              className="relative p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400"
            >
              <Bell size={23} />

              {reminders.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
                  {reminders.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Reminders
                  </h3>

                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close reminders"
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                {reminders.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-3">
                    No pending reminders. You're all caught up!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {reminders.map((task) => {
                      const dueDate = task.dueDate || task.due_date;
                      const overdue = dueDate < today;

                      return (
                        <div
                          key={task.id}
                          className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0"
                        >
                          <p className="text-sm font-medium text-gray-800 dark:text-white break-words">
                            {task.title}
                          </p>

                          <p
                            className={`text-xs mt-1 ${
                              overdue
                                ? "text-red-500"
                                : "text-orange-500"
                            }`}
                          >
                            {overdue ? "Overdue" : "Due today"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-2 min-w-0">
            <UserCircle
              size={36}
              className="text-purple-600 shrink-0"
            />

            <div className="min-w-0">
              <p className="font-medium text-gray-700 dark:text-gray-200 text-sm truncate">
                {userName}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[190px]">
                {userEmail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
