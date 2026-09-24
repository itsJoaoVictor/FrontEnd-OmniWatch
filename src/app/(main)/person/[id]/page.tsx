import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PersonDetailsResponse } from "@/types/person";
import { AddToListButton } from "@/components/shared/AddToListButton";

async function getPersonData(id: string): Promise<PersonDetailsResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/person/${id}`, {
      next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 3600 }
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch person data");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching person data:", error);
    return null;
  }
}

export default async function PersonDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getPersonData(id);

  if (!person) {
    notFound();
  }

  const imageUrl = "https://image.tmdb.org/t/p/w500";
  const posterUrl = "https://image.tmdb.org/t/p/w154";

  const knownForDepartment = person.known_for_department;
  const filteredCredits = person.combined_credits.filter(item => {
    if (item.department !== knownForDepartment) return false;
    if (knownForDepartment === 'Acting') {
      if (item.character && item.character.toLowerCase().includes("self")) return false;
      if (item.order !== null && item.order !== undefined && item.order > 10) return false;
    }
    return true;
  });

  // Sort by vote_count descending
  filteredCredits.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

  const seenIds = new Set();
  const knownFor = [];
  for (const item of filteredCredits) {
    if (!seenIds.has(item.id) && item.poster_path) {
      seenIds.add(item.id);
      knownFor.push(item);
    }
    if (knownFor.length >= 8) break;
  }

  // Group full credits by department
  const creditsByDepartment: Record<string, typeof person.combined_credits> = {};
  person.combined_credits.forEach(item => {
    const dept = item.department || "Outros";
    if (!creditsByDepartment[dept]) {
      creditsByDepartment[dept] = [];
    }
    creditsByDepartment[dept].push(item);
  });

  // Sort each department by release date
  for (const dept in creditsByDepartment) {
    creditsByDepartment[dept].sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateB - dateA;
    });
  }

  const sortedDepartments = Object.keys(creditsByDepartment).sort((a, b) => {
    if (a === knownForDepartment) return -1;
    if (b === knownForDepartment) return 1;
    return a.localeCompare(b);
  });

  const departmentTranslations: Record<string, string> = {
    'Acting': 'Atuação',
    'Directing': 'Direção',
    'Production': 'Produção',
    'Writing': 'Roteiro',
    'Creator': 'Criação',
    'Outros': 'Outros'
  };

  return (
    <main className="w-full min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column (Photo & Info) */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-6">
            <div className="rounded-lg overflow-hidden shadow-xl aspect-[2/3] relative w-full max-w-[300px] mx-auto md:mx-0">
              {person.profile_path ? (
                <Image
                  src={`${imageUrl}${person.profile_path}`}
                  alt={person.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">Sem Imagem</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b border-border pb-2">Informações Pessoais</h3>
              
              <div>
                <h4 className="font-semibold text-sm">Conhecido(a) por</h4>
                <p className="text-sm text-muted-foreground">
                  {person.known_for_department === 'Acting' ? 'Atuação' : person.known_for_department === 'Directing' ? 'Direção' : person.known_for_department}
                </p>
              </div>

              {person.birthday && (
                <div>
                  <h4 className="font-semibold text-sm">Nascimento</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(person.birthday).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {person.place_of_birth && (
                <div>
                  <h4 className="font-semibold text-sm">Local de Nascimento</h4>
                  <p className="text-sm text-muted-foreground">{person.place_of_birth}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Bio & Credits) */}
          <div className="flex-1 w-full md:w-2/3 lg:w-3/4">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{person.name}</h1>
            
            {person.biography && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">Biografia</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {person.biography || "Nenhuma biografia disponível."}
                </p>
              </div>
            )}

            {/* Known For */}
            {knownFor.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-semibold mb-4">Conhecido(a) por</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                  {knownFor.map(item => (
                    <div
                      key={item.id}
                      className="snap-start flex-shrink-0 w-[130px] flex flex-col gap-2 relative group"
                    >
                      <Link href={`/${item.media_type}/${item.id}`}>
                        <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-muted shadow-sm hover:opacity-80 transition-opacity">
                          <Image
                            src={`${posterUrl}${item.poster_path}`}
                            alt={item.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </Link>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AddToListButton tmdb_id={item.id} media_type={item.media_type as 'movie' | 'tv'} release_date={item.release_date} className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4" />
                      </div>
                      <Link href={`/${item.media_type}/${item.id}`}>
                        <p className="text-xs font-semibold text-center truncate hover:underline">{item.title}</p>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credits by Department */}
            {sortedDepartments.map(dept => {
              const items = creditsByDepartment[dept];
              if (!items || items.length === 0) return null;
              const deptName = departmentTranslations[dept] || dept;
              
              return (
                <div key={dept} className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">{deptName}</h3>
                  <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto">
                      {items.map((item, index) => {
                        const year = item.release_date ? new Date(item.release_date).getFullYear() : "—";
                        
                        return (
                          <div 
                            key={`${item.id}-${item.job || item.character || index}`} 
                            className="group flex items-center gap-4 p-4 border-b border-border/50 hover:bg-muted/30 transition-colors last:border-0"
                          >
                            <span className="w-12 flex-shrink-0 text-center text-sm font-medium text-muted-foreground">
                              {year}
                            </span>
                            
                            <div className="w-10 h-14 flex-shrink-0 bg-muted rounded overflow-hidden relative shadow-sm">
                              {item.poster_path ? (
                                <Image
                                  src={`${posterUrl}${item.poster_path}`}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-[10px] text-muted-foreground flex items-center justify-center h-full w-full">S/F</span>
                              )}
                            </div>

                            <div className="flex flex-col ml-2 flex-1">
                              <Link href={`/${item.media_type}/${item.id}`} className="font-semibold hover:underline">
                                {item.title}
                              </Link>
                              {item.character && (
                                <span className="text-sm text-muted-foreground">
                                  como {item.character}
                                </span>
                              )}
                              {item.job && (
                                <span className="text-sm text-muted-foreground">
                                  {item.job}
                                </span>
                              )}
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                              <AddToListButton tmdb_id={item.id} media_type={item.media_type as 'movie' | 'tv'} release_date={item.release_date} className="w-8 h-8 [&>svg]:w-4 [&>svg]:h-4" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </main>
  );
}
