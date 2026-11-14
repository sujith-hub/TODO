
"use client";

import { supabase } from "@/lib/supabase";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  ListTodo,
  CheckCircle,
  Settings,
  CalendarDays,
  LogOut,
  Sun,
  Moon,
  CalendarCheck,
  CalendarRange,
  Calendar,
  BarChart3,
} from "lucide-react";

import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";

    setDarkMode(isDark);

    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Toggle theme
  function toggleDarkMode() {
    const newMode = !darkMode;

    setDarkMode(newMode);

    localStorage.setItem("theme", newMode ? "dark" : "light");

    document.documentElement.classList.toggle("dark", newMode);
  }

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Tasks",
      path: "/dashboard/tasks",
      icon: ListTodo,
    },
    {
      name: "Daily Checks",
      path: "/dashboard/daily-checks",
      icon: CalendarCheck,
    },
    {
      name: "Weekly Checks",
      path: "/dashboard/weekly-checks",
      icon: CalendarRange,
    },
    {
      name: "Monthly Checks",
      path: "/dashboard/monthly-checks",
      icon: Calendar,
    },
    {
      name: "Completed",
      path: "/dashboard/completed",
      icon: CheckCircle,
    },
    {
      name: "Calendar",
      path: "/dashboard/calendar",
      icon: CalendarDays,
    },
    {
      name: "Analysis",
      path: "/dashboard/analysis",
      icon: BarChart3,
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: Settings,
    },
  ];

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to logout. Please try again.");
    }
  }

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col transition-colors duration-300">

      <h1 className="text-2xl font-bold text-purple-600 mb-10">
        MyTasks.
      </h1>

      <p className="text-xs font-semibold text-gray-400 mb-4">
        MENU
      </p>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.path ||
            (item.path !== "/dashboard" &&
              pathname.startsWith(item.path + "/"));

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? "bg-purple-100 text-purple-700 font-semibold dark:bg-purple-900 dark:text-purple-200"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggleDarkMode}
        className="flex items-center gap-3 w-full px-4 py-3 mt-6 rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}

        <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
      </button>

      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-500 hover:text-red-500 dark:text-gray-300"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

    </aside>
  );
}
