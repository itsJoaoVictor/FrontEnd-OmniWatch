import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasMissingPreviousEpisodes(
  progress: { season_number: number; episode_number: number }[] | undefined,
  seasonNumber: number,
  episodeNumber: number
): boolean {
  const prog = progress || [];
  
  // Check current season previous episodes
  for (let e = 1; e < episodeNumber; e++) {
    if (!prog.some(p => p.season_number === seasonNumber && p.episode_number === e)) {
      return true;
    }
  }
  
  if (seasonNumber > 1) {
    // Check if they have at least something in the previous season
    const hasPreviousSeason = prog.some(p => p.season_number === seasonNumber - 1);
    if (!hasPreviousSeason) return true;
    
    // Check if they have at least something in season 1
    const hasSeason1 = prog.some(p => p.season_number === 1);
    if (!hasSeason1) return true;
  }
  
  return false;
}
