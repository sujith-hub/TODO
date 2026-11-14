
"use client";

import { supabase } from "@/lib/supabase";

import { Search, Bell, UserCircle } from "lucide-react";

import { useEffect, useState } from "react";

export default function Header({ searchTerm, onSearchChange }) {
  const [userName, setUserName] = useState("My Profile");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function getProfile() {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUserName(
          data.user.user_metadata?.full_name || "My Profile"
        );
        setUserEmail(data.user.email || "");
      }
    }

    getProfile();
  }, []);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Good Morning!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here&apos;s what&apos;s happening with your tasks today.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-white rounded-lg px-4 py-2 border">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="outline-none ml-2 w-40 text-sm text-gray-900 placeholder:text-gray-500"
          />
        </div>

        <button className="text-gray-500 hover:text-purple-600">
          <Bell size={22} />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle size={35} className="text-purple-600" />
          <div>
            <p className="font-medium text-gray-700 text-sm">
              {userName}
            </p>
            <p className="text-xs text-gray-500">
              {userEmail}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
