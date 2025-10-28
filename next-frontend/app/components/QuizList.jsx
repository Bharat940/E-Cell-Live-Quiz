"use client";
import { useState } from "react";

export default function QuizList({
  quizzes,
  fetchQuizzes,
  setSelectedQuiz,
  setQuestions,
  fetchQuestions,
  adminKey,
  startQuiz,
  nextQuestion,
  toggleLeaderboard,
  leaderboardOn,
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
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="grid gap-4">
      {quizzes.map((quiz) => (
        <div
          key={quiz._id || quiz.id}
          className="bg-gray-800 shadow-md rounded-lg p-5 flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg text-white">{quiz.title}</h3>
              <p className="text-sm text-gray-400">
                Code: <b>{quiz.quizCode}</b>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedQuiz(quiz._id);
                  fetchQuestions(quiz._id);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded shadow transition"
              >
                View / Manage
              </button>

              <button
                onClick={() => startQuiz(quiz._id)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow transition"
              >
                Start Quiz
              </button>
              <button
                onClick={() => nextQuestion(quiz._id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow transition"
              >
                Next Question
              </button>
              <button
                onClick={() => toggleLeaderboard(quiz._id)}
                className={`${
                  leaderboardOn
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-gray-600 hover:bg-gray-700"
                } text-white px-3 py-1 rounded shadow transition`}
              >
                {leaderboardOn ? "Hide Leaderboard" : "Show Leaderboard"}
              </button>
              <button
                onClick={() => deleteQuiz(quiz._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded shadow transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
