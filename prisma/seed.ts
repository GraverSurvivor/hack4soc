import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BADGE_DEFINITIONS } from "../lib/gamification";

const prisma = new PrismaClient();

const SAMPLE_UNITS = [
  {
    title: "What is Photosynthesis?",
    summary:
      "Photosynthesis is how plants make their own food using sunlight, water, and carbon dioxide. This unit introduces the basic process.",
    storyMode: `Chapter 1: The Sun's Secret Gift

"Good morning, class!" said Ms. Leaf, the wisest tree in the forest. Her branches stretched wide, catching every ray of golden sunlight.

Young Sprout, a curious seedling, raised a tiny leaf. "Ms. Leaf, how do YOU eat? You don't have a mouth!"

Ms. Leaf chuckled, her leaves rustling like laughter. "Ah, Sprout! I have a secret superpower called photosynthesis!"

She explained: "Every morning, I drink water through my roots — slurp! Then I breathe in carbon dioxide from the air. But here's the magic part..."

Sprout leaned in closer.

"I capture sunlight in my green leaves," Ms. Leaf continued, her chlorophyll glowing. "My leaves are like tiny solar panels! They combine sunlight + water + CO₂ to make glucose — my food! And as a bonus, I release oxygen for everyone to breathe."

"So you're basically a solar-powered kitchen?" Sprout gasped.

"Exactly!" Ms. Leaf winked. "And tonight, when the sun sets... you'll never guess what happens next."

To be continued...`,
    calmMode: `# What is Photosynthesis?

## Definition
Photosynthesis is the process plants use to make food.

## What Plants Need
- **Sunlight** — energy from the sun
- **Water (H₂O)** — absorbed through roots
- **Carbon dioxide (CO₂)** — taken from the air

## What Plants Make
- **Glucose (C₆H₁₂O₆)** — plant food (sugar)
- **Oxygen (O₂)** — released into the air

## Simple Diagram to Imagine
\`\`\`
Sunlight + Water + CO₂  →  Glucose + Oxygen
       ↓
   Green Leaves (chlorophyll)
\`\`\`

## Key Fact
Chlorophyll is the green pigment in leaves. It captures sunlight.`,
    gameMode: `Level 1: The Photosynthesis Quest Begins!

🌟 Welcome, Explorer! You've entered the Plant Kingdom.

**Mission Brief:** Discover how plants make food without eating!

📍 You find a glowing green leaf. It pulses with energy.

**Intel Drop:** Plants don't eat food like you do. They MAKE it!

⚔️ CHALLENGE: What three things do plants need for photosynthesis?
A) Sunlight, Water, CO₂
B) Pizza, Soda, Candy
C) Rocks, Sand, Wind

✅ Correct! +100 XP! You've unlocked Level 2!

---

Level 2: The Chlorophyll Chamber

You enter a bright green chamber. Everything glows!

**Intel:** The green color comes from CHLOROPHYLL — nature's solar panel.

⚔️ CHALLENGE: What does chlorophyll capture?
A) Moonlight
B) Sunlight ✓
C) Starlight

🎉 Level 2 Complete! +100 XP!

---

Level 3: The Output Chamber

Two doors appear. Behind Door 1: Glucose (plant food). Behind Door 2: Oxygen (for us!).

**Final Challenge:** What gas do plants RELEASE during photosynthesis?
A) Carbon dioxide
B) Nitrogen  
C) Oxygen ✓

🏆 QUEST COMPLETE! You are now a Photosynthesis Master! +200 XP!`,
    quiz: [
      {
        question: "What is photosynthesis?",
        options: [
          "How plants make food using sunlight",
          "How animals digest food",
          "How roots absorb water only",
          "How leaves change color in fall",
        ],
        correct: "A",
        explanation:
          "Photosynthesis is the process where plants use sunlight, water, and CO₂ to make glucose (food).",
      },
      {
        question: "What gas do plants take IN during photosynthesis?",
        options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
        correct: "C",
        explanation: "Plants absorb carbon dioxide (CO₂) from the air through their leaves.",
      },
      {
        question: "What gas do plants RELEASE during photosynthesis?",
        options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Methane"],
        correct: "B",
        explanation: "Plants release oxygen (O₂) as a byproduct, which we breathe!",
      },
      {
        question: "What is chlorophyll?",
        options: [
          "A type of root",
          "The green pigment that captures sunlight",
          "Plant food",
          "A type of soil",
        ],
        correct: "B",
        explanation:
          "Chlorophyll is the green pigment in leaves that captures light energy.",
      },
      {
        question: "What do plants MAKE during photosynthesis?",
        options: ["Only water", "Glucose and oxygen", "Only carbon dioxide", "Soil nutrients"],
        correct: "B",
        explanation: "Plants produce glucose (food) and oxygen during photosynthesis.",
      },
    ],
  },
  {
    title: "The Light Reactions",
    summary:
      "The first stage of photosynthesis captures light energy and splits water molecules. This happens in the thylakoid membranes of chloroplasts.",
    storyMode: `Chapter 2: The Light Catcher

Sprout couldn't sleep. "Ms. Leaf, what happens to the sunlight at night?"

"Great question!" Ms. Leaf's chloroplasts began to glow. "Inside my leaves are tiny factories called chloroplasts. The first stage — the Light Reactions — is like charging a battery!"

Tiny Light Fairies (photons) danced into the thylakoid membranes. "We capture the light energy!" they sang, splitting water molecules with a dazzling flash.

"H₂O becomes H⁺, electrons, and O₂!" announced the Lead Fairy. "The energy gets stored in ATP and NADPH — my energy currency!"

"But what happens when the sun goes down?" Sprout whispered.

Ms. Leaf smiled mysteriously. "That's when the Calvin Cycle begins... and that's a story for tomorrow."

The forest grew quiet. Somewhere, a glucose molecule was being born.`,
    calmMode: `# The Light Reactions

## Location
- Inside **chloroplasts**
- Specifically in **thylakoid membranes**

## What Happens
1. Light energy hits chlorophyll
2. Water (H₂O) is split
3. Energy is stored in ATP and NADPH

## Inputs
- Light energy
- Water (H₂O)

## Outputs
- ATP (energy molecule)
- NADPH (electron carrier)
- Oxygen (O₂) — released

## Remember
Light reactions NEED light. They cannot happen in the dark.`,
    gameMode: `Level 4: The Thylakoid Temple

🏛️ You discover an ancient temple inside a chloroplast!

**Guardian:** "Only those who understand the Light Reactions may pass!"

⚔️ CHALLENGE: Where do light reactions occur?
A) Cell wall
B) Thylakoid membranes ✓
C) Nucleus

+100 XP! The temple doors open!

---

Level 5: Split the Water!

💧 A water molecule floats before you.

**Mission:** Split H₂O using light energy!

⚔️ CHALLENGE: What is produced when water is split?
A) ATP, NADPH, and O₂ ✓
B) Only glucose
C) Carbon dioxide

⚡ +100 XP! Energy captured!

---

Level 6: Energy Storage Vault

You find two glowing containers: ATP and NADPH.

**Intel:** These store energy for the next stage (Calvin Cycle).

🏆 Light Reactions Master badge earned! +200 XP!`,
    quiz: [
      {
        question: "Where do the light reactions occur?",
        options: ["Cell membrane", "Thylakoid membranes", "Nucleus", "Mitochondria"],
        correct: "B",
        explanation: "Light reactions take place in the thylakoid membranes inside chloroplasts.",
      },
      {
        question: "What is split during the light reactions?",
        options: ["Carbon dioxide", "Glucose", "Water", "Oxygen"],
        correct: "C",
        explanation: "Water molecules are split to release electrons, H⁺ ions, and oxygen.",
      },
      {
        question: "What energy molecules are produced?",
        options: ["DNA and RNA", "ATP and NADPH", "Glucose and fructose", "CO₂ and O₂"],
        correct: "B",
        explanation: "ATP and NADPH store the energy captured from light.",
      },
      {
        question: "Do light reactions need sunlight?",
        options: ["No, only at night", "Yes, they require light", "Only in winter", "Only in roots"],
        correct: "B",
        explanation: "Light reactions directly depend on light energy from the sun.",
      },
      {
        question: "What gas is released during light reactions?",
        options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen gas"],
        correct: "C",
        explanation: "Oxygen is released when water molecules are split.",
      },
    ],
  },
  {
    title: "The Calvin Cycle",
    summary:
      "The Calvin Cycle uses ATP and NADPH from light reactions to convert CO₂ into glucose. This is the second stage of photosynthesis.",
    storyMode: `Chapter 3: The Sugar Factory

The sun had set, but inside Ms. Leaf, the work was just beginning.

"Welcome to the Calvin Cycle," announced Enzyme Eddie, the busiest worker in the stroma. "We take the ATP and NADPH from the Light Reactions and use them to build glucose from CO₂!"

Sprout watched in awe as carbon atoms lined up like dancers. "It's like a factory assembly line!"

"Step 1: CO₂ enters. Step 2: ATP provides energy. Step 3: NADPH provides electrons. Step 4: Glucose comes out!" Eddie listed proudly.

"But here's the twist," Ms. Leaf added, her voice dropping to a whisper. "The Calvin Cycle doesn't need light directly. It uses the STORED energy from the light reactions. So even at night, as long as we have ATP and NADPH..."

"We keep making sugar!" Sprout finished, eyes wide.

"And THAT," said Ms. Leaf, "is the complete story of how I — and every green plant — turn sunlight into life."

The End. 🌿`,
    calmMode: `# The Calvin Cycle

## Location
- **Stroma** of the chloroplast (fluid area)

## Also Called
- Light-independent reactions
- Dark reactions (misleading — doesn't need darkness, just doesn't need direct light)

## Inputs
- CO₂ (carbon dioxide)
- ATP (from light reactions)
- NADPH (from light reactions)

## Output
- **Glucose (C₆H₁₂O₆)** — plant food

## Steps (Simplified)
1. CO₂ enters the cycle
2. ATP provides energy
3. NADPH provides electrons
4. Glucose is produced

## Key Point
The Calvin Cycle uses stored energy from light reactions to build sugar.`,
    gameMode: `Level 7: The Stroma Factory

🏭 You've reached the Calvin Cycle factory floor!

**Foreman:** "We build glucose here. Show me you understand!"

⚔️ CHALLENGE: Where does the Calvin Cycle occur?
A) Thylakoid
B) Stroma ✓
C) Cell wall

+100 XP!

---

Level 8: Carbon Capture

CO₂ molecules arrive at the factory entrance.

⚔️ CHALLENGE: What does the Calvin Cycle use to make glucose?
A) CO₂, ATP, and NADPH ✓
B) Only sunlight
C) Only water

+100 XP! Assembly line activated!

---

Level 9: The Final Product

A golden glucose molecule rolls off the line!

🏆 CALVIN CYCLE CHAMPION! 
🏆 PHOTOSYNTHESIS GRAND MASTER!
+300 XP!

You've completed the entire Photosynthesis Quest!`,
    quiz: [
      {
        question: "Where does the Calvin Cycle take place?",
        options: ["Thylakoid membrane", "Stroma", "Cell wall", "Nucleus"],
        correct: "B",
        explanation: "The Calvin Cycle occurs in the stroma of the chloroplast.",
      },
      {
        question: "What does the Calvin Cycle produce?",
        options: ["Oxygen", "Water", "Glucose", "Carbon dioxide"],
        correct: "C",
        explanation: "The Calvin Cycle's main product is glucose (plant food).",
      },
      {
        question: "What inputs does the Calvin Cycle need?",
        options: [
          "Only sunlight",
          "CO₂, ATP, and NADPH",
          "Only water",
          "Oxygen and nitrogen",
        ],
        correct: "B",
        explanation: "It uses CO₂ plus energy from ATP and NADPH (made in light reactions).",
      },
      {
        question: "Does the Calvin Cycle need direct sunlight?",
        options: [
          "Yes, always",
          "No, it uses stored energy from light reactions",
          "Only at night",
          "Only in summer",
        ],
        correct: "B",
        explanation: "It uses stored ATP/NADPH, not direct light.",
      },
      {
        question: "The Calvin Cycle is also called:",
        options: [
          "Light reactions",
          "Light-independent reactions",
          "Water splitting",
          "Oxygen release",
        ],
        correct: "B",
        explanation: "It's called light-independent because it doesn't directly need light.",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding NeuroSpark database...");

  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  const passwordHash = await bcrypt.hash("password123", 12);

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@neurospark.edu" },
    update: {},
    create: {
      email: "teacher@neurospark.edu",
      name: "Ms. Sarah Johnson",
      passwordHash,
      role: "TEACHER",
    },
  });

  const students = await Promise.all(
    [
      { email: "alex@student.edu", name: "Alex Rivera", profile: "story", scores: { story: 7, calm: 2, game: 1 } },
      { email: "jordan@student.edu", name: "Jordan Kim", profile: "calm", scores: { story: 2, calm: 8, game: 0 } },
      { email: "casey@student.edu", name: "Casey Morgan", profile: "game", scores: { story: 1, calm: 2, game: 7 } },
      { email: "riley@student.edu", name: "Riley Chen", profile: "story", scores: { story: 6, calm: 3, game: 1 } },
      { email: "taylor@student.edu", name: "Taylor Brooks", profile: "calm", scores: { story: 1, calm: 6, game: 3 } },
    ].map(async (s) => {
      const user = await prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          email: s.email,
          name: s.name,
          passwordHash,
          role: "STUDENT",
          xp: Math.floor(Math.random() * 300) + 50,
          streak: Math.floor(Math.random() * 5) + 1,
          lastActive: new Date(),
            brainProfile: {
              create: {
                dominant: s.profile,
                scores: s.scores as Prisma.InputJsonValue,
              },
          },
        },
        include: { brainProfile: true },
      });
      return user;
    })
  );

  const classroom = await prisma.classroom.upsert({
    where: { inviteCode: "SPARK1" },
    update: {},
    create: {
      name: "Ms. Johnson's Biology Class",
      inviteCode: "SPARK1",
      teacherId: teacher.id,
    },
  });

  for (const student of students) {
    await prisma.classroomMember.upsert({
      where: {
        userId_classroomId: {
          userId: student.id,
          classroomId: classroom.id,
        },
      },
      update: {},
      create: {
        userId: student.id,
        classroomId: classroom.id,
      },
    });
  }

  const existingCourse = await prisma.course.findFirst({
    where: { classroomId: classroom.id },
  });

  if (!existingCourse) {
    const course = await prisma.course.create({
      data: {
        title: "Introduction to Photosynthesis",
        classroomId: classroom.id,
        rawText: "Sample photosynthesis course content for NeuroSpark seed data.",
        fileName: "photosynthesis-sample.txt",
        units: {
          create: SAMPLE_UNITS.map((unit, index) => ({
            title: unit.title,
            summary: unit.summary,
            storyMode: unit.storyMode,
            calmMode: unit.calmMode,
            gameMode: unit.gameMode,
            order: index,
            quizQuestions: {
              create: unit.quiz.map((q) => ({
                question: q.question,
                options: q.options as Prisma.InputJsonValue,
                correct: q.correct,
                explanation: q.explanation,
              })),
            },
          })),
        },
      },
      include: { units: true },
    });

    // Add sample progress for students
    for (const student of students.slice(0, 3)) {
      for (let i = 0; i < course.units.length; i++) {
        const unit = course.units[i];
        const completed = i < 2;
        await prisma.studentProgress.create({
          data: {
            userId: student.id,
            unitId: unit.id,
            completed,
            quizScore: completed ? Math.floor(Math.random() * 40) + 60 : null,
            learningMode: (student.brainProfile?.dominant || "calm") as "story" | "calm" | "game",
            timeSpent: completed ? Math.floor(Math.random() * 600) + 300 : 0,
            completedAt: completed ? new Date() : null,
          },
        });
      }
    }

    console.log(`✅ Created course: ${course.title} with ${course.units.length} units`);
  }

  const brainExplorer = await prisma.badge.findUnique({
    where: { name: "Brain Explorer" },
  });
  if (brainExplorer) {
    for (const student of students) {
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: { userId: student.id, badgeId: brainExplorer.id },
        },
        update: {},
        create: { userId: student.id, badgeId: brainExplorer.id },
      });
    }
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("Teacher: teacher@neurospark.edu / password123");
  console.log("Students: alex@student.edu, jordan@student.edu, etc. / password123");
  console.log("Classroom invite code: SPARK1");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
