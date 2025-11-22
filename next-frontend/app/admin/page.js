"use client";

import { useState, useEffect } from "react";
import QuizList from "@/app/components/QuizList";
import AddQuestionForm from "@/app/components/AddQuestionForm";
import QuestionList from "@/app/components/QuestionList";

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "" });

  useEffect(() => {
    const key = localStorage.getItem("adminKey");
    if (key) setAdminKey(key);
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const res = await fetch("/api/quiz");
    const data = await res.json();
    if (data.success) setQuizzes(data.data || data.quizzes);
  };

  const fetchQuestions = async (quizId = selectedQuiz) => {
    if (!quizId) return;
    const res = await fetch(`/api/question?quizId=${quizId}`);
    const data = await res.json();
    if (data.success) setQuestions(data.data || []);
  };

  const createQuiz = async (e) => {
    e.preventDefault();
    const { title, description } = newQuiz;
    if (!title.trim()) return;

    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, adminKey }),
    });

    const data = await res.json();
    if (data.success) {
      setShowCreateForm(false);
      setNewQuiz({ title: "", description: "" });
      fetchQuizzes();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => setShowCreateForm((p) => !p)}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded shadow"
        >
          {showCreateForm ? "Cancel" : "Create Quiz"}
        </button>
      </div>

      {/* Create quiz form */}
      {showCreateForm && (
        <form
          onSubmit={createQuiz}
          className="bg-gray-800 p-5 rounded-lg flex flex-col gap-3 max-w-lg"
        >
          <input
            type="text"
            placeholder="Quiz title"
            value={newQuiz.title}
            onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
            className="bg-gray-700 px-3 py-2 rounded focus:outline-none"
          />
          <textarea
            placeholder="Quiz description"
            value={newQuiz.description}
            onChange={(e) =>
              setNewQuiz({ ...newQuiz, description: e.target.value })
            }
            className="bg-gray-700 px-3 py-2 rounded focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Create Quiz
          </button>
        </form>
      )}

      {!selectedQuiz ? (
        <QuizList
          quizzes={quizzes}
          fetchQuizzes={fetchQuizzes}
          setSelectedQuiz={setSelectedQuiz}
          fetchQuestions={fetchQuestions}
          adminKey={adminKey}
        />
      ) : (
        <>
          <button
            onClick={() => setSelectedQuiz(null)}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
          >
            ← Back to Quizzes
          </button>

          <QuestionList
            questions={questions || []}
            fetchQuestions={() => fetchQuestions(selectedQuiz)}
            adminKey={adminKey}
          />
          <AddQuestionForm
            quizId={selectedQuiz}
            fetchQuestions={() => fetchQuestions(selectedQuiz)}
            adminKey={adminKey}
          />
        </>
      )}
    </div>
  );
}
