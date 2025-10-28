import QuizPageClient from "@/app/components/QuizPageClient";

export default async function QuizPage({ params }) {
  const resolvedParams = await params;
  return <QuizPageClient quizCode={resolvedParams.code} />;
}
