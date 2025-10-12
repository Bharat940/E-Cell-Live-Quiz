import { connectDB } from "@/lib/db";
import Question from "@/models/Question";
import Quiz from "@/models/Quiz";

export async function POST(req) {
  try {
    const body = await req.json();
    const { quizId, questionText, options, correctIndex, timeLimit, adminKey } =
      body;

    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return Response.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    const question = await Question.create({
      quizId,
      questionText,
      options,
      correctIndex,
      timeLimit,
    });

    return Response.json({ success: true, data: question });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");

    const filter = quizId ? { quizId } : {};
    const questions = await Question.find(filter).lean();

    return Response.json({ success: true, data: questions });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      questionId,
      questionText,
      options,
      correctIndex,
      timeLimit,
      adminKey,
    } = body;

    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const updates = {};
    if (typeof questionText === "string") {
      updates.questionText = questionText;
    }
    if (Array.isArray(options) && options.length >= 2) {
      updates.options = options;
    }

    if (typeof correctIndex === "number") {
      updates.correctIndex = correctIndex;
    }

    if (typeof timeLimit === "number") {
      updates.timeLimit = timeLimit;
    }

    const question = await Question.findByIdAndUpdate(questionId, updates, {
      new: true,
    });
    if (!question) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: question });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { questionId, adminKey } = body;

    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const deletedQuestion = await Question.findByIdAndDelete(questionId);
    if (!deletedQuestion) {
      return Response.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
