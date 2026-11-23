export type Topic = {
  id: string;
  slug: string;
  title: string;
  subject: string;
  description: string;
  icon: string;
  color: string;
  lessonCount: number;
};

export const topics: Topic[] = [
  {
    id: "1",
    slug: "solar-system",
    title: "Solar System",
    subject: "Science",
    description: "Explore planets, gravity and orbits.",
    icon: "🌍",
    color: "#EDE9FE",
    lessonCount: 8,
  },
  {
    id: "7", slug: "atomic-structure", title: "Atomic Structure", subject: "Science", description: "Explore the nucleus, protons, neutrons and electrons in 3D.", icon: "⚛️", color: "#E0E7FF", lessonCount: 1,
  },
  {
    id: "2",
    slug: "fractions",
    title: "Fractions",
    subject: "Mathematics",
    description: "Understand fractions with visual examples.",
    icon: "🍕",
    color: "#FCE7F3",
    lessonCount: 6,
  },
  {
    id: "3",
    slug: "human-body",
    title: "Human Body",
    subject: "Biology",
    description: "Discover how organs work together.",
    icon: "🫀",
    color: "#DCFCE7",
    lessonCount: 10,
  },
  {
    id: "4",
    slug: "force-and-motion",
    title: "Force and Motion",
    subject: "Physics",
    description: "Experiment with gravity and movement.",
    icon: "🚀",
    color: "#FEF3C7",
    lessonCount: 7,
  },
  {
    id: "5",
    slug: "photosynthesis",
    title: "Photosynthesis",
    subject: "Biology",
    description: "Learn how plants make their food.",
    icon: "🌱",
    color: "#D1FAE5",
    lessonCount: 5,
  },
  {
    id: "6",
    slug: "geometry",
    title: "Geometry",
    subject: "Mathematics",
    description: "Explore shapes, angles and dimensions.",
    icon: "📐",
    color: "#DBEAFE",
    lessonCount: 9,
  },
];