
"use client";

import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { CheckCircle } from "lucide-react";

export default function CompletedTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompletedTasks() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .eq("completed", true)
        .order("created_at", { ascending: false });

      if (error) {
        alert("Unable to load completed tasks: " + error.message);
      } else {
        setTasks(data || []);
      }

      setLoading(false);
    }

    fetchCompletedTasks();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Completed Tasks
        </h1>

        <p className="text-gray-500 mb-8">
          All your successfully completed tasks.
        </p>

        {loading ? (
          <p className="text-purple-600 font-medium">
            Loading completed tasks...
          </p>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center">
            <CheckCircle
              size={40}
              className="mx-auto text-green-500 mb-3"
            />
            <p className="text-gray-600">
              No completed tasks yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-5 rounded-xl shadow-sm border flex items-center gap-3"
              >
                <CheckCircle className="text-green-600" size={22} />

                <div>
                  <h3 className="font-semibold text-gray-800 line-through">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {task.description}
                    </p>
                  )}

                  <p className="text-xs text-green-600 mt-2">
                    Completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
