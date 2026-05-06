import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import {
  dayExercises,
  exercises,
  workoutDays,
  workoutPlans,
} from "@/lib/db/schema";

export const starterPlan = {
  name: "Ficha inicial",
  days: [
    {
      name: "Lower 1",
      weekday: 0,
      exercises: [
        {
          name: "Cadeira flexora",
          sets: 3,
          repMin: 8,
          repMax: 12,
          instruction: "tronco levemente a frente",
        },
        {
          name: "Cadeira adutora",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "quadril flexionado",
        },
        {
          name: "Leg press",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: "pes medios/altos",
        },
        {
          name: "Elevacao pelvica",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: null,
        },
        {
          name: "Cadeira extensora",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "quadril estendido",
        },
        {
          name: "Panturrilha maquina",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: null,
        },
      ],
    },
    {
      name: "Upper 1",
      weekday: 1,
      exercises: [
        {
          name: "Supino reto maquina",
          sets: 3,
          repMin: 5,
          repMax: 8,
          instruction: "ou Smith",
        },
        {
          name: "Polia baixa para cima",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "crucifixo inclinado",
        },
        {
          name: "Puxada aberta maquina/barra",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: null,
        },
        {
          name: "T-bar row maquina",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: null,
        },
        {
          name: "Elevacao lateral maquina",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: null,
        },
        {
          name: "Rosca Scott",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: "ou Rosca Martelo padrao encurtado",
        },
        {
          name: "Triceps polia barra W",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: null,
        },
      ],
    },
    {
      name: "Lower 2",
      weekday: 3,
      exercises: [
        {
          name: "Stiff",
          sets: 3,
          repMin: 8,
          repMax: 12,
          instruction: "ou banco romano",
        },
        {
          name: "Cadeira abdutora",
          sets: 2,
          repMin: 12,
          repMax: 20,
          instruction: "quadril flexionado",
        },
        {
          name: "Leg press",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: "pes baixos, assento pra tras",
        },
        {
          name: "Cadeira flexora",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: "quadril neutro",
        },
        {
          name: "Leg press unilateral",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: "ou Bulgaro no Smith, quadril bem flexionado",
        },
        {
          name: "Cadeira extensora",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "quadril flexionado",
        },
        {
          name: "Panturrilha maquina",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: null,
        },
      ],
    },
    {
      name: "Upper 2",
      weekday: 4,
      exercises: [
        {
          name: "Puxada neutra maquina",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: "triangulo",
        },
        {
          name: "Remada",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "ou Cable Shrugs upper back",
        },
        {
          name: "Supino inclinado halteres",
          sets: 3,
          repMin: 6,
          repMax: 10,
          instruction: null,
        },
        {
          name: "Voador",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: "ou crucifixo maquina",
        },
        {
          name: "Elevacao lateral halteres + Elevacao frontal unilateral",
          sets: 2,
          repMin: 10,
          repMax: 15,
          instruction: null,
        },
        {
          name: "Rosca inclinada banco 45",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: "padrao alongado",
        },
        {
          name: "Triceps frances maquina",
          sets: 2,
          repMin: 8,
          repMax: 12,
          instruction: null,
        },
      ],
    },
  ],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function seedStarterPlan(userId: string) {
  const { db } = await import("@/lib/db");
  const [existingPlan] = await db
    .select({
      id: workoutPlans.id,
      isActive: workoutPlans.isActive,
    })
    .from(workoutPlans)
    .where(
      and(
        eq(workoutPlans.userId, userId),
        eq(workoutPlans.name, starterPlan.name),
      ),
    )
    .limit(1);

  if (existingPlan) {
    return { planId: existingPlan.id };
  }

  const planId = randomUUID();

  await db.insert(workoutPlans).values({
    id: planId,
    userId,
    name: starterPlan.name,
    isActive: true,
  });

  for (const [dayIndex, day] of starterPlan.days.entries()) {
    const workoutDayId = randomUUID();

    await db.insert(workoutDays).values({
      id: workoutDayId,
      planId,
      name: day.name,
      weekday: day.weekday,
      sortOrder: dayIndex + 1,
    });

    for (const [exerciseIndex, exercise] of day.exercises.entries()) {
      const exerciseId = randomUUID();

      await db.insert(exercises).values({
        id: exerciseId,
        userId,
        name: exercise.name,
        slug: `${slugify(exercise.name)}-${slugify(userId)}-${day.weekday}-${exerciseIndex + 1}`,
        muscleGroup: "General",
        movementPattern: null,
        notes: null,
      });

      await db.insert(dayExercises).values({
        id: randomUUID(),
        workoutDayId,
        exerciseId,
        sortOrder: exerciseIndex + 1,
        prescribedSets: exercise.sets,
        repMin: exercise.repMin,
        repMax: exercise.repMax,
        instruction: exercise.instruction,
      });
    }
  }

  return { planId };
}
