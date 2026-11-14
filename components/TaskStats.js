
"use client";

import {
  ListTodo,
  Clock,
  CheckCircle,
  Briefcase,
  BookOpen,
  Heart,
  Home,
  ShoppingBag,
  Folder,
} from "lucide-react";

export default function TaskStats({ tasks = [] }) {
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = totalTasks - completedTasks;

  const stats = [
    {
      title: "Total Tasks",
      count: totalTasks,
      icon: ListTodo,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Pending Tasks",
      count: pendingTasks,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Completed Tasks",
      count: completedTasks,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
  ];

  // Category-wise task counts
  const categoryIcons = {
    Work: Briefcase,
    Study: BookOpen,
    "Health Care": Heart,
    Home: Home,
    Shopping: ShoppingBag,
    Personal: Folder,
  };

  const categoryStats = Object.entries(
    tasks.reduce((result, task) => {
      const category = task.category || "Personal";

      result[category] = (result[category] || 0) + 1;

      return result;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 mb-8">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {item.title}
                  </p>

                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mt-3">
                    {item.count}
                  </h2>
                </div>

                <div className={`${item.bg} ${item.color} p-3 rounded-xl`}>
                  <Icon size={25} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Statistics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5">
          Category-wise Statistics
        </h2>

        {categoryStats.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No category statistics available. Add your first task!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map(([category, count]) => {
              const Icon = categoryIcons[category] || Folder;

              return (
                <div
                  key={category}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <Icon size={20} />
                    </div>

                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {category}
                    </span>
                  </div>

                  <span className="text-xl font-bold text-purple-600 ml-3">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
