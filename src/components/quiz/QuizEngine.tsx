"use client";
import { useState } from "react";
import { submitQuizAttempt } from "@/lib/db";
import type { Quiz, QuizAttempt } from "@/types";
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Award } from "lucide-react";

interface QuizEngineProps {
  quiz: Quiz;
  studentId: string;
  previousAttempt?: QuizAttempt | null;
  onPassed?: () => void;
}

type QuizState = "intro" | "taking" | "result";

export default function QuizEngine({
  quiz,
  studentId,
  previousAttempt,
  onPassed,
}: QuizEngineProps) {
  const questions = quiz.questions ?? [];
  const [state, setState] = useState<QuizState>(
    previousAttempt?.passed ? "result" : "intro"
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [result, setResult] = useState<QuizAttempt | null>(previousAttempt ?? null);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = questions[currentQ];
  const selectedAnswer = answers[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;
  const allAnswered = answers.every((a) => a !== null);

  function selectAnswer(optionIndex: number) {
    if (state !== "taking") return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
  }

  async function submitQuiz() {
    if (!allAnswered) return;
    setLoading(true);
    try {
      const attempt = await submitQuizAttempt(
        studentId,
        quiz.id,
        answers as number[],
        questions,
        quiz.passing_score
      );
      setResult(attempt);
      setState("result");
      if (attempt.passed) onPassed?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function retake() {
    setAnswers(Array(questions.length).fill(null));
    setCurrentQ(0);
    setResult(null);
    setState("taking");
    setShowExplanation(false);
  }

  // INTRO
  if (state === "intro") {
    return (
      <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
          <Award className="w-7 h-7 text-brand-600" />
        </div>
        <h3 className="font-display text-brand-900 text-xl font-medium mb-2">{quiz.title}</h3>
        <p className="text-slate-400 text-sm mb-1">{questions.length} questions</p>
        <p className="text-slate-400 text-sm mb-6">
          Passing score: <span className="text-brand-600 font-medium">{quiz.passing_score}%</span>
        </p>
        {previousAttempt && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium inline-block ${
            previousAttempt.passed
              ? "bg-green-50 text-green-600"
              : "bg-amber-50 text-amber-600"
          }`}>
            Previous best: {previousAttempt.score}%
          </div>
        )}
        <button
          onClick={() => setState("taking")}
          className="bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-colors"
        >
          {previousAttempt ? "Retake Quiz" : "Start Quiz"}
        </button>
      </div>
    );
  }

  // RESULT
  if (state === "result" && result) {
    const correctCount = result.answers
      ? (result.answers as number[]).filter((a, i) => a === questions[i]?.correct_index).length
      : 0;

    return (
      <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            result.passed ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"
          }`}>
            {result.passed
              ? <CheckCircle className="w-8 h-8 text-green-500" />
              : <XCircle className="w-8 h-8 text-red-400" />
            }
          </div>
          <h3 className="font-display text-brand-900 text-2xl font-medium mb-1">
            {result.passed ? "Well Done!" : "Keep Studying"}
          </h3>
          <p className="text-slate-400 text-sm">
            {result.passed
              ? "You passed this quiz. You may proceed to the next lesson."
              : `You scored ${result.score}%. You need ${quiz.passing_score}% to pass.`}
          </p>
        </div>

        {/* Score display */}
        <div className="bg-brand-50 rounded-xl p-4 mb-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-display text-brand-900 text-2xl font-semibold">{result.score}%</div>
            <div className="text-slate-400 text-xs">Your Score</div>
          </div>
          <div>
            <div className="font-display text-brand-900 text-2xl font-semibold">
              {correctCount}/{questions.length}
            </div>
            <div className="text-slate-400 text-xs">Correct</div>
          </div>
          <div>
            <div className={`font-display text-2xl font-semibold ${result.passed ? "text-green-600" : "text-red-500"}`}>
              {result.passed ? "Pass" : "Fail"}
            </div>
            <div className="text-slate-400 text-xs">Result</div>
          </div>
        </div>

        {/* Answer review */}
        {result.answers && (
          <div className="mb-5">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-brand-600 text-sm font-medium hover:text-brand-800 mb-3"
            >
              {showExplanation ? "Hide" : "Review"} Answers
            </button>
            {showExplanation && (
              <div className="space-y-3">
                {questions.map((q, i) => {
                  const userAnswer = (result.answers as number[])[i];
                  const isCorrect = userAnswer === q.correct_index;
                  return (
                    <div key={q.id} className={`p-3 rounded-xl border text-sm ${
                      isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}>
                      <div className="font-medium text-slate-700 mb-2">{i + 1}. {q.question}</div>
                      <div className={`text-xs ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                        {isCorrect ? "✓ Correct" : `✗ You answered: ${q.options[userAnswer]}`}
                      </div>
                      {!isCorrect && (
                        <div className="text-xs text-green-600 mt-1">
                          Correct: {q.options[q.correct_index]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!result.passed && (
          <button
            onClick={retake}
            className="w-full flex items-center justify-center gap-2 border border-brand-200 text-brand-700 font-medium text-sm py-2.5 rounded-xl hover:bg-brand-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Retake Quiz
          </button>
        )}
      </div>
    );
  }

  // TAKING QUIZ
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-400 font-medium">
          Question {currentQ + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentQ
                  ? "w-6 bg-brand-600"
                  : answers[i] !== null
                  ? "w-2 bg-brand-300"
                  : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <h3 className="font-display text-brand-900 text-lg font-medium mb-5 leading-snug">
        {question?.question}
      </h3>

      {/* Options */}
      <div className="space-y-2.5 mb-6">
        {question?.options.map((option, i) => (
          <button
            key={i}
            onClick={() => selectAnswer(i)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
              selectedAnswer === i
                ? "border-brand-500 bg-brand-50 text-brand-900 font-medium"
                : "border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50/50"
            }`}
          >
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mr-3 ${
              selectedAnswer === i
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-500"
            }`}>
              {String.fromCharCode(65 + i)}
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="text-slate-400 text-sm disabled:opacity-30 hover:text-slate-600"
        >
          ← Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={submitQuiz}
            disabled={!allAnswered || loading}
            className="bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? "Submitting..." : "Submit Quiz"}
            <CheckCircle className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
            disabled={selectedAnswer === null}
            className="bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
