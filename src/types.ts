export interface Player {
  id: number;
  name: string;
  scores: Score[];
  currentScore: number | null;
}

export interface Score {
  value: number;
  isStrikethrough: boolean;
  passes: number;
}