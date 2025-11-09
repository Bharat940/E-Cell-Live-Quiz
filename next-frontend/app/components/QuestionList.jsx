"use client";

import { useState } from "react";

export default function QuestionList({ questions, fetchQuestions, adminKey }) {
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editedQuestionText, setEditedQuestionText] = useState("");
  const [editedOptions, setEditedOptions] = useState([]);
  const [editedCorrectIndex, setEditedCorrectIndex] = useState(null);
  const [editedTimeLimit, setEditedTimeLimit] = useState(30);

  const deleteQuestion = async (questionId) => {
    const res = await fetch("/api/question", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, adminKey }),
    });
    const data = await res.json();
    if (data.success) fetchQuestions();
  };

  const saveEdits = async (questionId) => {
    if (editedCorrectIndex === null) {
      alert("Please select the correct option!");
      return;
    }
    const res = await fetch("/api/question", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId,
        questionText: editedQuestionText,
        options: editedOptions,
        correctIndex: editedCorrectIndex,
        timeLimit: editedTimeLimit,
        adminKey,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setEditingQuestionId(null);
      fetchQuestions();
      alert("Question updated!");
    } else alert(data.error);
  };

  if (!Array.isArray(questions)) {
    return <p>No questions found.</p>;
  }

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-white">Questions</h2>
      <div className="grid gap-3">
        {questions.map((q) => (
          <div
            key={q._id}
            className="bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition"
          >
            {editingQuestionId === q._id ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={editedQuestionText}
                  onChange={(e) => setEditedQuestionText(e.target.value)}
                  className="border border-gray-600 bg-gray-700 text-white p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {editedOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={editedCorrectIndex === i}
                      onChange={() => setEditedCorrectIndex(i)}
                      className="accent-green-400 cursor-pointer"
                    />
                    <input
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...editedOptions];
                        newOptions[i] = e.target.value;
                        setEditedOptions(newOptions);
                      }}
                      className="border border-gray-600 bg-gray-700 text-white p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
                <input
                  type="number"
                  placeholder="Time Limit (seconds)"
                  value={editedTimeLimit}
                  onChange={(e) => setEditedTimeLimit(Number(e.target.value))}
                  className="border border-gray-600 bg-gray-700 text-white p-2 mb-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => saveEdits(q._id)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1 rounded shadow transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingQuestionId(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded shadow transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-gray-100 mb-2">
                  {q.questionText}
                </p>
                <ul className="list-disc pl-6 mb-2">
                  {q.options.map((opt, i) => (
                    <li
                      key={i}
                      className={
                        i === q.correctIndex
                          ? "font-bold text-green-400"
                          : "text-gray-300"
                      }
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
                <p className="text-gray-300 mb-2">
                  Time Limit: <b>{q.timeLimit}s</b>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingQuestionId(q._id);
                      setEditedQuestionText(q.questionText);
                      setEditedOptions([...q.options]);
                      setEditedCorrectIndex(q.correctIndex);
                      setEditedTimeLimit(q.timeLimit);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded shadow transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteQuestion(q._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded shadow transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
