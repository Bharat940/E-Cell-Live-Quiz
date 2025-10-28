"use client";

import { useState } from "react";

export default function AddQuestionForm({ quizId, fetchQuestions, adminKey }) {
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [timeLimit, setTimeLimit] = useState(30);

  const addQuestion = async () => {
    if (correctIndex === null) {
      alert("Please select the correct option!");
      return;
    }
    const res = await fetch("/api/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId,
        questionText,
        options,
        correctIndex,
        timeLimit,
        adminKey,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert("✅ Question added!");
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(null);
      fetchQuestions();
    } else alert(data.error);
  };

  return (
    <div className="mt-6 bg-gray-800 shadow-md rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4 text-white">
        Add New Question
      </h3>
      <textarea
        placeholder="Question text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        className="border border-gray-600 bg-gray-700 text-white p-3 w-full mb-3 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      {options.map((opt, i) => (
        <div key={i} className="flex items-center mb-2 gap-3">
          <input
            type="radio"
            name="correctOption"
            checked={correctIndex === i}
            onChange={() => setCorrectIndex(i)}
            className="accent-green-400 cursor-pointer"
          />
          <input
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={(e) => {
              const newOptions = [...options];
              newOptions[i] = e.target.value;
              setOptions(newOptions);
            }}
            className="border border-gray-600 bg-gray-700 text-white p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      ))}
      <input
        type="number"
        placeholder="Time Limit (seconds)"
        value={timeLimit}
        onChange={(e) => setTimeLimit(Number(e.target.value))}
        className="border border-gray-600 bg-gray-700 text-white p-2 mb-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <button
        onClick={addQuestion}
        className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded shadow transition"
      >
        Add Question
      </button>
    </div>
  );
}
