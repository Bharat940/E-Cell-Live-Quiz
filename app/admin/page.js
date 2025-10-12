"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuizList from "../components/QuizList";
import QuestionList from "../components/QuestionList";
import AddQuestionForm from "../components/AddQuestionForm";

export default function AdminPage() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const storedKey = localStorage.getItem("adminKey");
    if (storedKey === process.env.NEXT_PUBLIC_ADMIN_KEY) {
      setAdminKey(storedKey);
      setIsVerified(true);
    } else {
      router.push("/verify-admin");
    }
  }, [router]);

  const fetchQuizzes = async () => {
    const res = await fetch("/api/quiz");
    const data = await res.json();
    if (data.success) setQuizzes(data.data);
  };

  const fetchQuestions = async (quizId) => {
    const res = await fetch(`/api/question?quizId=${quizId}`);
    const data = await res.json();
    if (data.success) setQuestions(data.data);
  };

  const createQuiz = async () => {
    if (!title.trim()) return alert("Enter a quiz title!");
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, adminKey }),
    });
    const data = await res.json();
    if (data.success) {
      alert("✅ Quiz created!");
      setTitle("");
      setDescription("");
      fetchQuizzes();
    } else alert(data.error);
  };

  if (!isVerified)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <p className="text-lg font-medium text-gray-100">
          Verifying admin access...
        </p>
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">
        Admin Panel
      </h1>

      {/* Create New Quiz */}
      <div className="mb-8 bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-white">
          Create New Quiz
        </h2>
        <input
          type="text"
          placeholder="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-600 bg-gray-700 text-white p-3 w-full mb-3 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <textarea
          placeholder="Quiz Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-600 bg-gray-700 text-white p-3 w-full mb-4 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={createQuiz}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded shadow-md transition"
        >
          Create Quiz
        </button>
      </div>

      {/* Quiz List */}
      <QuizList
        quizzes={quizzes}
        fetchQuizzes={fetchQuizzes}
        setSelectedQuiz={setSelectedQuiz}
        setQuestions={setQuestions}
        fetchQuestions={fetchQuestions}
        adminKey={adminKey}
      />

      {selectedQuiz && (
        <div className="mt-8">
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
      )}
    </div>
  );
}
