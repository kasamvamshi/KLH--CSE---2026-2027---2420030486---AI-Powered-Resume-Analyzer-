
const SKILL_ALIASES = {
  js: "javascript",
  node: "node.js",
  nodejs: "node.js",
  "node js": "node.js",
  express: "express.js",
  "express js": "express.js",
  reactjs: "react",
  "react.js": "react",
  ts: "typescript",
  postgres: "postgresql",
  postgresql: "postgresql",
  mongo: "mongodb",
  "mongo db": "mongodb",
  ml: "machine learning",
  dl: "deep learning",
  "c plus plus": "c++",
  "c plus": "c++",
  "restful apis": "rest apis",
  "rest api": "rest apis",
  "data structure": "data structures",
  "algorithm": "algorithms",
};

function normalizeSkill(skill) {
  const normalized = skill
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  return SKILL_ALIASES[normalized] || normalized;
}

function containsSkill(text, skill) {
  const normalizedText = text.toLowerCase();
  const normalizedSkill = normalizeSkill(skill);

  const escaped = normalizedSkill.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const pattern = new RegExp(
    `(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`,
    "i"
  );

  return pattern.test(normalizedText);
}

function uniqueSkills(skills = []) {
  const seen = new Set();

  return skills.filter((skill) => {
    if (typeof skill !== "string" || !skill.trim()) {
      return false;
    }

    const normalized = normalizeSkill(skill);

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function compareSkills(candidateSkills, jobSkills) {
  const candidates = new Set(candidateSkills.map(normalizeSkill));

  const matchedSkills = jobSkills.filter((skill) =>
    candidates.has(normalizeSkill(skill))
  );

  const missingSkills = jobSkills.filter(
    (skill) => !candidates.has(normalizeSkill(skill))
  );

  const score =
    jobSkills.length === 0
      ? null
      : Math.round((matchedSkills.length / jobSkills.length) * 100);

  return {
    score,
    matchedSkills,
    missingSkills,
    total: jobSkills.length,
  };
}

export async function matchResumeToJob({
  resumeText,
  resumeAnalysis = null,
  job,
}) {
  if (!resumeText || typeof resumeText !== "string" || !job) {
    throw new Error("Resume text and job are required.");
  }

  // Combine AI-extracted skills with text-based evidence.
  // This still works if AI analysis has not been performed.
  const aiSkills = Array.isArray(resumeAnalysis?.skills)
    ? resumeAnalysis.skills
    : [];

  const candidateSkills = uniqueSkills(aiSkills);

  const requiredSkills = uniqueSkills(job.requiredSkills || []);
  const preferredSkills = uniqueSkills(job.preferredSkills || []);

  // Match aliases against actual resume text as well as AI-extracted skills.
  const allJobSkills = uniqueSkills([
    ...requiredSkills,
    ...preferredSkills,
  ]);

  const textMatchedSkills = allJobSkills.filter((skill) =>
    containsSkill(resumeText, skill)
  );

  const availableSkills = uniqueSkills([
    ...candidateSkills,
    ...textMatchedSkills,
  ]);

  const required = compareSkills(availableSkills, requiredSkills);
  const preferred = compareSkills(availableSkills, preferredSkills);

  // Required skills matter more than preferred skills.
  // When preferred skills are absent, score only required skills.
  let score = null;

  if (required.total > 0) {
    score =
      preferred.total > 0
        ? Math.round(required.score * 0.8 + preferred.score * 0.2)
        : required.score;
  } else if (preferred.total > 0) {
    score = preferred.score;
  }

  let explanation;

  if (score === null) {
    explanation =
      "This job has no required or preferred skills listed, so a skill match score cannot be calculated.";
  } else if (score >= 80) {
    explanation =
      "Strong skill overlap. The resume covers most of the listed job requirements.";
  } else if (score >= 50) {
    explanation =
      "Moderate skill overlap. Review the missing skills to identify areas for improvement.";
  } else {
    explanation =
      "Limited skill overlap. Developing the missing skills may improve alignment with this role.";
  }

  return {
    score,
    scoreType: "weighted-skill-overlap",
    matchedSkills: required.matchedSkills,
    missingSkills: required.missingSkills,
    preferredMatchedSkills: preferred.matchedSkills,
    preferredMissingSkills: preferred.missingSkills,
    totalRequiredSkills: required.total,
    totalMatchedSkills: required.matchedSkills.length,
    requiredSkillScore: required.score,
    preferredSkillScore: preferred.score,
    explanation,
  };
}
