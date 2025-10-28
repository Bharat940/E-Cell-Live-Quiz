import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [{ type: String, trim: true }],
      validate: (v) => Array.isArray(v) && v.length >= 2,
      required: true,
    },
    correctIndex: { type: Number, required: true, min: 0 },
    timeLimit: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export default mongoose.models.Question ||
  mongoose.model("Question", questionSchema);
