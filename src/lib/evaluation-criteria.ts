/** @format */

export const EVALUATION_CRITERIA = [
  {
    key: "NOVELTY",
    subject: "Novelty",
    description:
      "Innovation and originality of the solution. Does it bring a fresh perspective or approach to the problem? Are there unique features or methods that distinguish it from existing solutions?",
    fullMark: 100,
    order: 1,
  },
  {
    key: "ARTICULATION",
    subject: "Articulation",
    description:
      "Clarity and effectiveness of the presentation. How well did the team communicate their idea, problem statement, and solution? Was the pitch compelling and easy to understand?",
    fullMark: 100,
    order: 2,
  },
  {
    key: "TECHNICAL_DEPTH",
    subject: "Technical Depth",
    description:
      "Complexity and quality of the technical implementation. Does the solution demonstrate a strong understanding of the underlying technology? Are there sophisticated technical components or integrations?",
    fullMark: 100,
    order: 3,
  },
  {
    key: "FEASIBILITY",
    subject: "Feasibility",
    description:
      "Practicality and viability of the solution. Can this be realistically implemented and scaled? Are there clear pathways for deployment and adoption? Does it address real-world constraints?",
    fullMark: 100,
    order: 4,
  },
] as const;

export type CriterionKey = (typeof EVALUATION_CRITERIA)[number]["key"];
