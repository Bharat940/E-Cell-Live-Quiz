"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function QuizList({
  quizzes,
  fetchQuizzes,
  setSelectedQuiz,
  fetchQuestions,
  adminKey,
}) {
  const router = useRouter();
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [edited, setEdited] = useState({ title: "", description: "" });

  const deleteQuiz = async (quizId) => {
    if (!confirm("Delete this quiz and all its questions?")) return;
    const res = await fetch("/api/quiz", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId }),
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Quiz deleted successfully");
      fetchQuizzes();
    } else {
      toast.error(data.error || "Failed to delete quiz");
    }
  };

  const startEditing = (quiz) => {
    setEditingQuizId(quiz._id);
    setEdited({ title: quiz.title, description: quiz.description });
  };

  const saveEdit = async (quizId) => {
    if (!edited.title.trim()) {
      toast.error("Quiz title cannot be empty");
      return;
    }
    const res = await fetch("/api/quiz", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, ...edited }),
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Quiz updated successfully");
      setEditingQuizId(null);
      fetchQuizzes();
    } else {
      toast.error(data.error || "Failed to update quiz");
    }
  };

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-gray-400 text-lg">No quizzes yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Click "Create Quiz" to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => (
        <div
          key={quiz._id || quiz.id}
          className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
        >
          {editingQuizId === quiz._id ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={edited.title}
                  onChange={(e) =>
                    setEdited({ ...edited, title: e.target.value })
                  }
                  className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-xl w-full focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Description
                </label>
                <textarea
                  value={edited.description}
                  onChange={(e) =>
                    setEdited({ ...edited, description: e.target.value })
                  }
                  rows={3}
                  className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-xl w-full focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(quiz._id)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-4 py-2 rounded-xl font-semibold transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingQuizId(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Quiz Header */}
              <div className="mb-4">
                <h3 className="font-bold text-xl text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {quiz.description || "No description"}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Code:</span>
                  <span className="font-mono font-bold text-cyan-400 bg-gray-800 px-3 py-1 rounded-lg">
                    {quiz.quizCode}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedQuiz(quiz._id);
                    fetchQuestions(quiz._id);
                  }}
                  className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 px-3 py-2 rounded-lg font-medium transition-all text-sm"
                >
                  📝 Questions
                </button>

                <button
                  onClick={() => router.push(`/admin/${quiz._id}`)}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 px-3 py-2 rounded-lg font-medium transition-all text-sm"
                >
                  🎮 Control
                </button>

                <button
                  onClick={() => router.push(`admin/presentation/${quiz._id}`)}
                  className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 text-yellow-300 px-3 py-2 rounded-lg font-medium transition-all text-sm"
                >
                  📊 Present
                </button>

                <button
                  onClick={() => startEditing(quiz)}
                  className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded-lg font-medium transition-all text-sm"
                >
                  ✏️ Edit
                </button>
              </div>

              {/* Delete Button - Full Width */}
              <button
                onClick={() => deleteQuiz(quiz._id)}
                className="w-full mt-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 px-3 py-2 rounded-lg font-medium transition-all text-sm"
              >
                🗑️ Delete
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
