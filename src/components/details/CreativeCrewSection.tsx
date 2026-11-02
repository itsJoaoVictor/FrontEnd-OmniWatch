import Image from "next/image";
import Link from "next/link";
import { CrewItem } from "@/types/details";

interface CreativeCrewSectionProps {
  crew: CrewItem[];
}

const JOB_TRANSLATIONS: Record<string, string> = {
  Director: "Direção",
  Screenplay: "Roteiro",
  Writer: "Roteiro",
  Author: "História Original",
  Novel: "Obra Original",
  "Original Music Composer": "Trilha Sonora",
  "Director of Photography": "Direção de Fotografia",
  Producer: "Produção",
  "Executive Producer": "Produção Executiva",
};

export function CreativeCrewSection({ crew }: CreativeCrewSectionProps) {
  if (!crew || crew.length === 0) return null;

  // Filtra os cargos mais nobres da produção cinematográfica
  const priorityJobs = [
    "Director",
    "Screenplay",
    "Writer",
    "Original Music Composer",
    "Director of Photography",
    "Producer",
  ];

  const seenIds = new Set<number>();
  const keyMembers: CrewItem[] = [];

  for (const job of priorityJobs) {
    const membersWithJob = crew.filter((c) => c.job === job);
    for (const member of membersWithJob) {
      if (!seenIds.has(member.id)) {
        seenIds.add(member.id);
        keyMembers.push(member);
        if (keyMembers.length >= 6) break;
      }
    }
    if (keyMembers.length >= 6) break;
  }

  // Se não encontrar por cargos específicos, pega os primeiros membros únicos
  if (keyMembers.length === 0) {
    for (const member of crew) {
      if (!seenIds.has(member.id)) {
        seenIds.add(member.id);
        keyMembers.push(member);
        if (keyMembers.length >= 4) break;
      }
    }
  }

  if (keyMembers.length === 0) return null;

  return (
    <div className="bg-card/70 border border-border rounded-2xl p-5 shadow-xs my-6">
      <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-4">
        Equipe Criativa Principal
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {keyMembers.map((member) => {
          const translatedJob = JOB_TRANSLATIONS[member.job] || member.job;
          const initials = member.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <Link
              key={`${member.id}-${member.job}`}
              href={`/person/${member.id}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 transition-colors group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden bg-muted border border-border/80 shrink-0 relative">
                {member.profile_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                    alt={member.name}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground bg-primary/10 text-primary">
                    {initials}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {member.name}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {translatedJob}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
