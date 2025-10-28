import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOption: { type: Number, required: true },
    correct: { type: Boolean, required: true },
    answerTime: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    name: { type: String, required: true },
    score: { type: Number, default: 0, min: 0 },
    answers: { type: [answerSchema], default: [] },
    socketId: { type: String, default: null, index: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

participantSchema.index({ quizId: 1, name: 1 }, { unique: true });

export default mongoose.models.Participant ||
  mongoose.model("Participant", participantSchema);
