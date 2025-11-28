"use client";

import { useState, useEffect } from "react";
import QuizList from "@/app/components/QuizList";
import AddQuestionForm from "@/app/components/AddQuestionForm";
import QuestionList from "@/app/components/QuestionList";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "" });

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => setAdminKey(data.adminKey));

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
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
      credentials: "include",
    });

    const data = await res.json();
    if (data.success) {
      toast.success("✅ Quiz created successfully!");
      setShowCreateForm(false);
      setNewQuiz({ title: "", description: "" });
      fetchQuizzes();
    } else {
      toast.error(data.error || "Failed to create quiz");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage your quizzes and questions
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm((p) => !p)}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              {showCreateForm ? (
                <>
                  <span>✕</span>
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <span>+</span>
                  <span>Create Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Quiz Form */}
        {showCreateForm && (
          <div className="mb-8 animate-fadeIn">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
                <span>📝</span>
                <span>Create New Quiz</span>
              </h2>
              <form onSubmit={createQuiz} className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter quiz title"
                    value={newQuiz.title}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, title: e.target.value })
                    }
                    className="bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Enter quiz description"
                    value={newQuiz.description}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, description: e.target.value })
                    }
                    rows={3}
                    className="bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  Create Quiz
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Quiz List or Question Management */}
        {!selectedQuiz ? (
          <QuizList
            quizzes={quizzes}
            fetchQuizzes={fetchQuizzes}
            setSelectedQuiz={setSelectedQuiz}
            fetchQuestions={fetchQuestions}
            adminKey={adminKey}
          />
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setSelectedQuiz(null)}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-gray-700"
            >
              <span>←</span>
              <span>Back to Quizzes</span>
            </button>

            {/* Question Management */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-xl">
              <QuestionList
                questions={questions}
                fetchQuestions={() => fetchQuestions(selectedQuiz)}
                adminKey={adminKey}
              />
              <AddQuestionForm
                quizId={selectedQuiz}
                fetchQuestions={() => fetchQuestions(selectedQuiz)}
                adminKey={adminKey}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
