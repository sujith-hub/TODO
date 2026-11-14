
"use client";

import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import TaskList from "@/components/TaskList";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ListTodo } from "lucide-react";

export default function MyTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        alert("Unable to load tasks: " + error.message);
      } else {
        setTasks(
          (data || []).map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.due_date || "",
            completed: task.completed,
          }))
        );
      }

      setLoading(false);
    }

    fetchTasks();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <ListTodo size={28} className="text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            My Tasks
          </h1>
        </div>

        <p className="text-gray-500 mb-8">
          View all your personal tasks in one place.
        </p>

        {loading ? (
          <p className="text-purple-600">Loading tasks...</p>
        ) : (
          <TaskList
            tasks={tasks}
            onToggle={() => alert("Use the Dashboard to update tasks for now.")}
            onDelete={() => alert("Use the Dashboard to delete tasks for now.")}
            onEdit={() => alert("Use the Dashboard to edit tasks for now.")}
          />
        )}
      </main>
    </div>
  );
}
