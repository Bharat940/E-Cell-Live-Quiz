"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifyAdminPage() {
  const [key, setKey] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedKey = localStorage.getItem("adminKey");
    if (storedKey === process.env.NEXT_PUBLIC_ADMIN_KEY) {
      router.push("/admin");
    }
  }, [router]);

  const handleSubmit = () => {
    if (key === process.env.NEXT_PUBLIC_ADMIN_KEY) {
      localStorage.setItem("adminKey", key);
      router.push("/admin");
    } else {
      alert("Invalid Admin Key!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="border rounded-md shadow-md p-8 w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">Admin Login</h1>
        <input
          type="password"
          placeholder="Enter Admin Key"
          className="border p-2 w-full mb-4"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white w-full py-2 rounded"
        >
          Verify
        </button>
      </div>
    </div>
  );
}
