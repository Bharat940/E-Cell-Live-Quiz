import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";

export async function GET() {
  try {
    await connectDB();
    const quizzes = await Quiz.find().lean();
    return Response.json({ success: true, data: quizzes });
  } catch (err) {
    console.error("DB connection failed:", err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
