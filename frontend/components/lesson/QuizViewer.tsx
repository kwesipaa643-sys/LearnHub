'use client';
// components/lesson/QuizViewer.tsx
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, Loader2, Trophy, RotateCcw, AlertCircle } from 'lucide-react';
import { quizzesApi } from '@/lib/api';
import { QuizAttemptResult } from '@/types/api';

interface Props {
  quizId: number;
  onPass?: () => void;
}

export function QuizViewer({ quizId, onPass }: Props) {
  const [phase, setPhase] = useState<'intro' | 'taking' | 'result'>('intro');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const { data: quizRes } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizzesApi.getForLesson(quizId),
  });

  const quiz = quizRes?.data;
  const questions = quiz?.randomize_questions
    ? [...(quiz?.questions ?? [])].sort(() => Math.random() - 0.5)
    : quiz?.questions ?? [];

  // Start timer
  useEffect(() => {
    if (phase === 'taking' && quiz?.time_limit_minutes) {
      setTimeLeft(quiz.time_limit_minutes * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t === null || t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startMutation = useMutation({
    mutationFn: () => quizzesApi.startAttempt(quizId),
    onSuccess: (res) => {
      setAttemptId(res.data.attempt_id);
      setPhase('taking');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload: Parameters<typeof quizzesApi.submitAttempt>[1]) =>
      quizzesApi.submitAttempt(quizId, payload),
    onSuccess: (res) => {
      clearInterval(timerRef.current);
      setResult(res.data);
      setPhase('result');
      if (res.data.passed) onPass?.();
    },
  });

  const handleSubmit = () => {
    if (!attemptId) return;
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_options: answers[q.id] ?? [],
      text_answer: textAnswers[q.id] ?? undefined,
    }));
    submitMutation.mutate({ attempt_id: attemptId, answers: formattedAnswers });
  };

  const toggleOption = (questionId: number, optionId: number, multiSelect: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (multiSelect) {
        return {
          ...prev,
          [questionId]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!quiz) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  // INTRO
  if (phase === 'intro') {
    return (
      <div className="max-w-xl mx-auto text-center py-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">{quiz.title}</h2>
        {quiz.description && <p className="text-muted-foreground mb-6">{quiz.description}</p>}

        <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
          <div className="p-4 bg-muted/50 rounded-xl">
            <div className="font-bold text-lg">{questions.length}</div>
            <div className="text-muted-foreground text-xs">Questions</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <div className="font-bold text-lg">{quiz.passing_score}%</div>
            <div className="text-muted-foreground text-xs">Passing score</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <div className="font-bold text-lg">
              {quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : '∞'}
            </div>
            <div className="text-muted-foreground text-xs">Time limit</div>
          </div>
        </div>

        <button
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className="h-11 px-8 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto">
          {startMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Start Quiz
        </button>
      </div>
    );
  }

  // RESULT
  if (phase === 'result' && result) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className={`text-center p-8 rounded-2xl border-2 mb-8 ${
          result.passed
            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
        }`}>
          {result.passed ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          ) : (
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          )}
          <h2 className="text-2xl font-display font-bold mb-1">
            {result.passed ? '🎉 Quiz Passed!' : 'Not quite there yet'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {result.passed
              ? 'Great job! You can continue to the next lesson.'
              : `You need ${quiz.passing_score}% to pass. Keep studying and try again!`}
          </p>
          <div className="text-4xl font-display font-bold">
            {Math.round(result.percentage)}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {result.score} / {result.max_score} points
          </p>
        </div>

        {/* Answer review */}
        {quiz.show_answers_after && (
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold">Review answers</h3>
            {result.questions?.map((q, i) => {
              const answer = result.answers?.find((a) => a.question_id === q.id);
              return (
                <div key={q.id} className={`p-4 rounded-xl border ${
                  answer?.is_correct ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950' : 'border-red-200 bg-red-50 dark:bg-red-950'
                }`}>
                  <div className="flex items-start gap-2 mb-3">
                    {answer?.is_correct
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  {q.options.map((opt) => (
                    <div key={opt.id} className={`text-xs px-3 py-1.5 rounded-lg mb-1 ${
                      opt.is_correct ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' :
                      answer?.selected_options?.includes(opt.id) ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                      'text-muted-foreground'
                    }`}>
                      {opt.content}
                    </div>
                  ))}
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 flex gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!result.passed && (quiz.max_attempts === null || quiz.max_attempts > 1) && (
          <button
            onClick={() => {
              setPhase('intro');
              setAnswers({});
              setTextAnswers({});
              setCurrentQ(0);
              setResult(null);
            }}
            className="flex items-center gap-2 h-10 px-5 border border-border rounded-lg text-sm hover:bg-muted transition-colors mx-auto">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        )}
      </div>
    );
  }

  // TAKING
  const question = questions[currentQ];
  const isMulti = question?.type === 'multi_select';
  const isFillBlank = question?.type === 'fill_blank';
  const selectedOptions = answers[question?.id] ?? [];
  const answered = isFillBlank ? !!textAnswers[question?.id] : selectedOptions.length > 0;

  return (
    <div>
      {/* Quiz header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-lg">{quiz.title}</h2>
          <p className="text-muted-foreground text-sm">
            Question {currentQ + 1} of {questions.length}
          </p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-lg ${
            timeLeft < 60 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-muted text-foreground'
          }`}>
            <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-6">
        <div className="progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="p-6 bg-muted/40 rounded-2xl border border-border mb-6">
        <p className="font-semibold mb-1 text-xs text-muted-foreground uppercase tracking-wider">
          {isMulti ? 'Select all that apply' : question?.type === 'true_false' ? 'True or False' : 'Choose one'}
        </p>
        <p className="text-lg font-medium">{question?.question}</p>
      </div>

      {/* Options */}
      {!isFillBlank ? (
        <div className="space-y-2.5 mb-6">
          {question?.options.map((opt) => {
            const selected = selectedOptions.includes(opt.id);
            return (
              <button key={opt.id}
                onClick={() => toggleOption(question.id, opt.id, isMulti)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm transition-all ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/40 hover:bg-muted'
                }`}>
                <span className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                  }`}>
                    {selected && '✓'}
                  </span>
                  {opt.content}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mb-6">
          <input
            type="text"
            value={textAnswers[question?.id] ?? ''}
            onChange={(e) => setTextAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
            placeholder="Type your answer..."
            className="w-full h-12 px-4 rounded-xl border-2 border-input bg-background text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentQ((q) => q - 1)} disabled={currentQ === 0}
          className="h-10 px-5 rounded-xl border border-border hover:bg-muted text-sm disabled:opacity-40 transition-colors">
          ← Previous
        </button>

        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ((q) => q + 1)}
            className="h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitMutation.isPending}
            className="h-10 px-6 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
