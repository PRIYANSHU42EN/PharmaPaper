"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

export default function QuizPage({ params }: { params: Promise<{ subject: string }> }) {
  const resolvedParams = use(params);
  const subjectName = decodeURIComponent(resolvedParams.subject);
  const { isSignedIn } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz?subject=${encodeURIComponent(subjectName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load questions");
        return res.json();
      })
      .then((data) => {
        setQuestions(data.quizzes || []);
      })
      .catch((err: any) => {
        setError(err.message || "Something went wrong loading the quiz.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectName]);

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;

    const currentQuestion = questions[currentIndex];
    if (selectedOption === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
    setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setQuizFinished(true);
      if (isSignedIn) {
        saveQuizResult();
      }
    }
  };

  const saveQuizResult = async () => {
    setSavingResult(true);
    try {
      await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectName,
          score: score + (selectedOption === questions[currentIndex].answer ? 1 : 0),
          total: questions.length,
        }),
      });
    } catch (err) {
      console.error("Failed to save quiz results:", err);
    } finally {
      setSavingResult(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-charcoal text-brand-cream flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        Compiling Quiz Material...
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-brand-charcoal text-brand-cream flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.05]" />
        <div className="w-full max-w-md p-8 glass-panel border border-brand-border rounded-2xl relative z-10 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto text-brand text-xl mb-4">
            📝
          </div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-cream uppercase mb-2">
            No Quiz Available
          </h1>
          <p className="text-xs text-brand-cream/60 leading-relaxed mb-6 font-mono">
            {error || `There are no quiz questions configured for "${subjectName}" yet.`}
          </p>
          <Link href="/notes" className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/95 text-brand-charcoal text-xs font-bold tracking-wider uppercase transition-all inline-block">
            Browse Syllabus Vault
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="relative w-full min-h-screen bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white pb-16">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.05]" />

      <header className="sticky top-0 w-full h-16 glass-panel border-b border-brand-border flex items-center justify-between px-6 md:px-12 z-50 backdrop-blur-md bg-brand-charcoal/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(142,146,144,0.8)]" />
          <span className="font-bebas text-xl tracking-wider text-brand-cream">
            PHARMA<span className="text-brand"> TEST</span>
          </span>
        </div>
        <Link href="/notes" className="px-4 py-1.5 rounded-full border border-brand-border hover:border-brand/40 hover:text-brand text-xs font-semibold tracking-wider uppercase transition-all duration-300">
          Exit Test
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12 relative z-10">
        {!quizFinished ? (
          <div className="flex flex-col gap-8">
            {/* Header info */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-brand font-bold uppercase tracking-widest font-mono">
                {subjectName}
              </span>
              <div className="flex items-center justify-between">
                <h1 className="font-bebas text-3xl uppercase tracking-wide">
                  Question {currentIndex + 1} <span className="text-brand-cream/40">of {questions.length}</span>
                </h1>
                <span className="text-xs font-mono text-brand-cream/55">
                  Score: {score}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-brand-gray border border-brand-border/40 overflow-hidden mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-brand"
                />
              </div>
            </div>

            {/* Question card */}
            <div className="p-8 glass-panel border border-brand-border rounded-3xl flex flex-col gap-6">
              <h2 className="text-base font-semibold leading-relaxed">
                {currentQuestion.question}
              </h2>

              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((opt, idx) => {
                  let optStyle = "border-brand-border hover:border-brand-cream/20 bg-brand-charcoal/20 text-brand-cream/80";
                  if (selectedOption === idx) {
                    optStyle = "border-brand bg-brand/5 text-brand-cream";
                  }
                  if (isSubmitted) {
                    if (idx === currentQuestion.answer) {
                      optStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold";
                    } else if (selectedOption === idx) {
                      optStyle = "border-rose-500 bg-rose-500/10 text-rose-400";
                    } else {
                      optStyle = "border-brand-border/20 bg-brand-charcoal/5 opacity-55 text-brand-cream/40";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isSubmitted}
                      className={`w-full p-4 rounded-2xl text-left text-xs transition-all duration-200 border flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {isSubmitted && idx === currentQuestion.answer && (
                        <span className="text-emerald-400 text-xs font-mono">✓ CORRECT</span>
                      )}
                      {isSubmitted && selectedOption === idx && idx !== currentQuestion.answer && (
                        <span className="text-rose-400 text-xs font-mono">✗ INCORRECT</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="border-t border-brand-border/40 pt-4 flex flex-col gap-2"
                  >
                    <span className="text-[10px] text-brand font-bold uppercase tracking-widest font-mono">
                      EXPLANATION
                    </span>
                    <p className="text-xs text-brand-cream/75 leading-relaxed">
                      {currentQuestion.explanation || "No explanation provided for this question."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end border-t border-brand-border/40 pt-6 mt-2">
                {!isSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                      selectedOption !== null
                        ? "bg-brand hover:bg-brand/90 text-brand-charcoal"
                        : "bg-brand-gray text-brand-cream/30 border border-brand-border cursor-not-allowed"
                    }`}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-brand-charcoal font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    {currentIndex + 1 === questions.length ? "Finish Quiz" : "Next Question"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Finished summary */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mx-auto p-8 glass-panel border border-brand-border rounded-3xl text-center flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-2xl">
              🏆
            </div>
            <div>
              <span className="text-[10px] text-brand-cream/40 uppercase tracking-widest font-mono">
                CONGRATULATIONS
              </span>
              <h1 className="font-bebas text-4xl uppercase tracking-wide mt-1">
                Quiz Finished!
              </h1>
              <p className="text-xs text-brand-cream/55 mt-1">
                You took the assessment test for {subjectName}
              </p>
            </div>

            <div className="py-4 px-8 bg-brand-charcoal/50 border border-brand-border rounded-2xl">
              <span className="text-[10px] text-brand-cream/40 uppercase font-mono block">FINAL SCORE</span>
              <span className="font-bebas text-5xl text-brand block mt-1">
                {score} <span className="text-brand-cream/30 text-2xl">/ {questions.length}</span>
              </span>
              <span className="text-[10px] font-mono text-brand-cream/50 mt-1 block">
                {Math.round((score / questions.length) * 100)}% Accuracy
              </span>
            </div>

            {savingResult && (
              <span className="text-[10px] font-mono text-brand-cream/40 animate-pulse">
                SAVING PERFORMANCE STATS...
              </span>
            )}

            <div className="flex flex-col gap-2 w-full mt-4">
              <Link
                href="/notes"
                className="w-full py-3 rounded-xl bg-brand hover:bg-brand/90 text-brand-charcoal text-xs font-bold uppercase tracking-wider transition-all"
              >
                Back to Syllabus Vault
              </Link>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setIsSubmitted(false);
                  setScore(0);
                  setQuizFinished(false);
                }}
                className="w-full py-3 rounded-xl border border-brand-border hover:bg-brand-gray text-brand-cream/80 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Retake Assessment
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
