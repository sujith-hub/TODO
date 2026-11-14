
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
  Menu,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

// Theme subscription
function subscribeToTheme(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("theme-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("theme-change", callback);
  };
}

function getThemeSnapshot() {
  return localStorage.getItem("theme") === "dark";
}

function getServerThemeSnapshot() {
  return false;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);

  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  // Apply saved theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Toggle theme
  function toggleDarkMode() {
    const newMode = !getThemeSnapshot();

    localStorage.setItem(
      "theme",
      newMode ? "dark" : "light"
    );

    window.dispatchEvent(new Event("theme-change"));
  }

  // Navigation items
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

  // Logout
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
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h1 className="text-xl font-bold text-purple-600">
          MyTasks.
        </h1>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 h-screen overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col transition-transform duration-300 md:translate-x-0 md:w-64 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* LOGO AND MOBILE CLOSE BUTTON */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-purple-600">
            MyTasks.
          </h1>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={22} />
          </button>
        </div>

        <p className="text-xs font-semibold text-gray-400 mb-4">
          MENU
        </p>

        {/* NAVIGATION */}
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
                onClick={() => setMobileOpen(false)}
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

        {/* DARK MODE */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center gap-3 w-full px-4 py-3 mt-6 rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? (
            <Sun size={20} />
          ) : (
            <Moon size={20} />
          )}

          <span>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* LOGOUT BELOW DARK MODE */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 mt-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}
