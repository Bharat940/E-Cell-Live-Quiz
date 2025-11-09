import { connectDB } from "@/lib/db";
import Participant from "@/models/Participant";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");
    if (!quizId) {
      return Response.json(
        { success: false, error: "Missing quizId" },
        { status: 400 }
      );
    }

    await connectDB();

    const top = await Participant.find({ quizId })
      .sort({ score: -1, updatedAt: 1 })
      .limit(10)
      .select("name score")
      .lean();

    return Response.json({ success: true, data: top });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
