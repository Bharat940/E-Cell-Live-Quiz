"use client";

import { useState } from "react";

export default function QuizList({
  quizzes,
  fetchQuizzes,
  setSelectedQuiz,
  setQuestions,
  fetchQuestions,
  adminKey,
}) {
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const deleteQuiz = async (quizId) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    const res = await fetch("/api/quiz", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, adminKey }),
    });
    const data = await res.json();
    if (data.success) {
      setSelectedQuiz((prevSelected) =>
        prevSelected === quizId ? null : prevSelected
      );
      if (setQuestions) setQuestions([]);
      fetchQuizzes();
    } else alert(data.error);
  };

  const saveEdits = async (quizId) => {
    const res = await fetch("/api/quiz", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId,
        title: editedTitle,
        description: editedDescription,
        adminKey,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setEditingQuizId(null);
      fetchQuizzes();
      alert("✅ Quiz updated!");
    } else alert(data.error);
  };

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4 text-white">All Quizzes</h2>
      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <div
            key={quiz._id}
            className="bg-gray-800 shadow-md rounded-lg p-5 hover:shadow-lg transition flex flex-col gap-3"
          >
            {editingQuizId === quiz._id ? (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="border border-gray-600 bg-gray-700 text-white p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Quiz Title"
                />
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="border border-gray-600 bg-gray-700 text-white p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Quiz Description"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => saveEdits(quiz._id)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1 rounded shadow transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingQuizId(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded shadow transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span
                    className="font-semibold text-lg cursor-pointer hover:underline text-white"
                    onClick={() => {
                      setSelectedQuiz(quiz._id);
                      fetchQuestions(quiz._id);
                    }}
                  >
                    {quiz.title}
                  </span>{" "}
                  <span className="text-sm text-gray-400 ml-2">
                    ({quiz.isLive ? "LIVE" : "Not Live"})
                  </span>
                  <p className="text-sm text-gray-300 mt-1">
                    Code: <b>{quiz.quizCode}</b>
                  </p>
                  {quiz.description && (
                    <p className="text-gray-200 mt-1">{quiz.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingQuizId(quiz._id);
                      setEditedTitle(quiz.title);
                      setEditedDescription(quiz.description || "");
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded shadow transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      fetch(`/api/quiz`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          quizId: quiz._id,
                          isLive: !quiz.isLive,
                          adminKey,
                        }),
                      }).then(fetchQuizzes)
                    }
                    className={`px-3 py-1 rounded shadow text-white transition ${
                      quiz.isLive
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {quiz.isLive ? "End" : "Go Live"}
                  </button>
                  <button
                    onClick={() => deleteQuiz(quiz._id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded shadow transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
