import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  name: { type: String, required: true },
  score: { type: Number, default: 0 },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      selectedOption: Number,
      correct: Boolean,
      answerTime: { type: Number, default: 0 },
    },
  ],
  joinedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Participant ||
  mongoose.model("Participant", participantSchema);
