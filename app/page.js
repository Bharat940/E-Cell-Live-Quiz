"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [quizCode, setQuizCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (quizCode.trim().length !== 6)
      return alert("Enter a valid 6-character quiz code!");
    router.push(`/quiz/${quizCode.toUpperCase()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="border p-8 rounded-md shadow-md w-80">
        <h1 className="text-2xl font-bold text-center mb-4">Join a Quiz</h1>
        <input
          type="text"
          placeholder="Enter Quiz Code"
          value={quizCode}
          onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
          className="border p-2 w-full mb-4 text-center tracking-widest"
          maxLength={6}
        />
        <button
          onClick={handleJoin}
          className="bg-green-600 text-white w-full py-2 rounded"
        >
          Join
        </button>
      </div>
    </div>
  );
}
