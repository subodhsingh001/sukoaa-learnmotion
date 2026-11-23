export type Planet = { id: string; name: string; color: string; size: number; orbit: number; period: number; description: string; fact: string };
export const planets: Planet[] = [
  { id: "mercury", name: "Mercury", color: "#b9a99b", size: 7, orbit: 13, period: 8, description: "The smallest planet and closest to the Sun.", fact: "A year on Mercury lasts about 88 Earth days." },
  { id: "venus", name: "Venus", color: "#f5cb8b", size: 10, orbit: 19, period: 11, description: "Our hottest planet, with a thick atmosphere.", fact: "Venus is hotter than Mercury despite being farther from the Sun." },
  { id: "earth", name: "Earth", color: "#59a8f5", size: 11, orbit: 26, period: 15, description: "Our home planet, with liquid water and life.", fact: "Earth takes about 365 days to orbit the Sun." },
  { id: "mars", name: "Mars", color: "#ec815b", size: 9, orbit: 33, period: 19, description: "The Red Planet, known for its rusty surface.", fact: "Mars has the tallest known volcano in the Solar System." },
  { id: "jupiter", name: "Jupiter", color: "#e7b88d", size: 19, orbit: 42, period: 25, description: "The largest planet, a giant made mostly of gas.", fact: "Jupiter has a giant storm called the Great Red Spot." },
  { id: "saturn", name: "Saturn", color: "#e7d49b", size: 17, orbit: 52, period: 32, description: "A gas giant famous for its bright rings.", fact: "Saturn's rings are made mostly of ice and rock." },
  { id: "uranus", name: "Uranus", color: "#91dfe0", size: 14, orbit: 62, period: 39, description: "An ice giant that rotates on its side.", fact: "Uranus has an extreme axial tilt of about 98 degrees." },
  { id: "neptune", name: "Neptune", color: "#6e8cf1", size: 14, orbit: 73, period: 47, description: "A distant ice giant with powerful winds.", fact: "Neptune takes about 165 Earth years to orbit the Sun." },
];
export const solarQuiz = [
 { question: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Earth"], answer: 1, explanation: "Mercury is the closest planet to the Sun." },
 { question: "Which planet is the largest?", options: ["Jupiter", "Saturn", "Neptune"], answer: 0, explanation: "Jupiter is the largest planet in our Solar System." },
 { question: "What causes planets to stay in orbit around the Sun?", options: ["Wind", "Magnetism alone", "Gravity and their motion"], answer: 2, explanation: "The Sun's gravity and each planet's motion combine to create an orbit." },
];
