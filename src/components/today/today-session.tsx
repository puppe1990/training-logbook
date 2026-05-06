"use client";

import { useState } from "react";

import { type TodayWorkoutViewModel } from "@/lib/workouts/get-today-workout";

import { ExerciseCard } from "@/components/today/exercise-card";
import { SessionNote } from "@/components/today/session-note";

type TodaySessionProps = {
  workout: TodayWorkoutViewModel;
};

export function TodaySession({ workout }: TodaySessionProps) {
  const [sessionId, setSessionId] = useState(workout.sessionId);
  const [exerciseCompletion, setExerciseCompletion] = useState(
    () =>
      Object.fromEntries(
        workout.exercises.map((exercise) => [
          exercise.dayExerciseId,
          exercise.isExerciseCompleted,
        ]),
      ) as Record<string, boolean>,
  );
  const firstIncompleteExerciseIndex = workout.exercises.findIndex(
    (exercise) => !exerciseCompletion[exercise.dayExerciseId],
  );

  return (
    <>
      <SessionNote sessionId={sessionId} />

      <div className="grid gap-4">
        {workout.exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.dayExerciseId}
            sessionId={sessionId}
            exercise={exercise}
            isCurrent={index === firstIncompleteExerciseIndex}
            locked={
              sessionId === null && index !== firstIncompleteExerciseIndex
            }
            onSessionCreated={setSessionId}
            onCompletionChange={(dayExerciseId, isCompleted) =>
              setExerciseCompletion((current) => ({
                ...current,
                [dayExerciseId]: isCompleted,
              }))
            }
          />
        ))}
      </div>
    </>
  );
}
