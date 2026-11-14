"use client";

import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { UserCircle, Mail } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setName(data.user.user_metadata?.full_name || "");
      setEmail(data.user.email || "");
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function updateProfile(e) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });

    setSaving(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Profile updated successfully!");
    }
  }

  if (loading) {
    return <p className="p-8">Loading settings...</p>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Settings
        </h1>

        <p className="text-gray-500 mb-8">
          Manage your account information.
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle size={45} className="text-purple-600" />
            <div>
              <h2 className="font-semibold text-gray-800">
                My Profile
              </h2>
              <p className="text-sm text-gray-500">
                Personal account details
              </p>
            </div>
          </div>

          <form onSubmit={updateProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <div className="flex items-center gap-2 border rounded-lg px-4 py-3 bg-gray-100">
                <Mail size={18} className="text-gray-500" />
                <span className="text-gray-700">{email}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email address cannot be changed here.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}