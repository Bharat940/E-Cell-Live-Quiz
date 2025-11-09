"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    if (!confirm("Delete this quiz?")) return;
    const res = await fetch("/api/quiz", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, adminKey }),
    });
    const data = await res.json();
    if (data.success) fetchQuizzes();
  };

  const startEditing = (quiz) => {
    setEditingQuizId(quiz._id);
    setEdited({ title: quiz.title, description: quiz.description });
  };

  const saveEdit = async (quizId) => {
    const res = await fetch("/api/quiz", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, adminKey, ...edited }),
    });
    const data = await res.json();
    if (data.success) {
      setEditingQuizId(null);
      fetchQuizzes();
    }
  };

  return (
    <div className="grid gap-4">
      {quizzes.map((quiz) => (
        <div
          key={quiz._id || quiz.id}
          className="bg-gray-800 shadow-md rounded-lg p-5 flex flex-col gap-3"
        >
          {editingQuizId === quiz._id ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={edited.title}
                onChange={(e) =>
                  setEdited({ ...edited, title: e.target.value })
                }
                className="bg-gray-700 px-3 py-2 rounded"
              />
              <textarea
                value={edited.description}
                onChange={(e) =>
                  setEdited({ ...edited, description: e.target.value })
                }
                className="bg-gray-700 px-3 py-2 rounded"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(quiz._id)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingQuizId(null)}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-lg">{quiz.title}</h3>
                <p className="text-sm text-gray-400">{quiz.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Code: <b>{quiz.quizCode}</b>
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => {
                    setSelectedQuiz(quiz._id);
                    fetchQuestions(quiz._id);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                >
                  Manage Questions
                </button>

                <button
                  onClick={() => router.push(`/admin/${quiz._id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  Quiz Control
                </button>

                <button
                  onClick={() => router.push(`admin/presentation/${quiz._id}`)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                >
                  Presentation
                </button>

                <button
                  onClick={() => startEditing(quiz)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuiz(quiz._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {quizzes.length === 0 && (
        <p className="text-gray-500 text-center">No quizzes yet.</p>
      )}
    </div>
  );
}
