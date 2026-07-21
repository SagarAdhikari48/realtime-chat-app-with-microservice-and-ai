"use client";
import Loading from "@/components/Loading";
import { useAppData, user_service } from "@/context/AppContext";
import axios from "axios";
import { ArrowLeft, Mail, Pencil, Save, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, loading, isAuth, setUser } = useAppData();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuth) {
      router.push("/login");
    }
    if (user?.name) {
      setName(user.name);
    }
  }, [loading, isAuth, user]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (name.trim() === user?.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const token = sessionStorage.getItem("token");
      const { data } = await axios.post(
        `${user_service}/api/v1/update/user`,
        { name: name.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // backend returns { message, user, token } — update token and user
      sessionStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success("Name updated!");
      setEditing(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setEditing(false);
  };

  if (loading) return <Loading />;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to chats
        </Link>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <p className="text-sm text-gray-400">Your profile</p>
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <User className="w-4 h-4" />
              Display name
            </label>
            {editing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                  maxLength={50}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2">
                <span className="text-white">{user?.name}</span>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Edit name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Email field (read-only) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Mail className="w-4 h-4" />
              Email address
            </label>
            <div className="bg-gray-700 rounded-lg px-3 py-2 text-gray-300 select-all">
              {user?.email}
            </div>
          </div>

          {/* Account info */}
          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              User ID: <span className="font-mono">{user?._id}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
