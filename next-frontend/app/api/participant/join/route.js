import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Participant from "@/models/Participant";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("BODY RECEIVED:", body); // ✅ add this line

    const { quizCode, name } = body;
    if (!quizCode || !name.trim()) {
      return Response.json(
        {
          success: false,
          error: "Quiz's code and name are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const quiz = await Quiz.findOne({ quizCode: quizCode.toUpperCase() });
    if (!quiz) {
      return Response.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    const participant = await Participant.findOneAndUpdate(
      { quizId: quiz._id, name: name.trim() },
      { $setOnInsert: { score: 0, answers: [] } },
      { new: true, upsert: true }
    );

    return Response.json({
      success: true,
      data: {
        quizId: quiz._id,
        participantId: participant._id,
        name: participant.name,
        title: quiz.title,
        description: quiz.description,
        isLive: quiz.isLive,
      },
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
