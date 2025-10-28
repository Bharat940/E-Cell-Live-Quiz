import { connectDB } from "@/lib/db";
import Question from "@/models/Question";
import Participant from "@/models/Participant";

export async function POST(req) {
  try {
    const body = req.json();
    const { participantId, questionId, selectedOption, elapsedMs } = body;
    if (!participantId || !questionId || typeof selectedOption !== "number") {
      return Response.json(
        {
          success: false,
          error: "Invalid body",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const q = await Question.findById(questionId);
    if (!q) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 400 }
      );
    }

    const correct = selectedOption === q.correctIndex;
    const timeLimitMs = (q.timeLimit ?? 30) * 1000;
    const safeElapsed = Math.max(
      0,
      Math.min(timeLimitMs, Number(elapsedMs || timeLimitMs))
    );
    const delta = correct ? 1000 : 0;

    const updated = await Participant.findByIdAndUpdate(
      participantId,
      {
        $inc: { score: delta },
        $push: {
          answers: {
            questionId: q._id,
            selectedOption,
            correct,
            answerTimeMs: safeElapsed,
          },
        },
      },
      { new: true }
    );

    return Response.json({
      success: true,
      data: { correct, newScore: updated.score },
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
