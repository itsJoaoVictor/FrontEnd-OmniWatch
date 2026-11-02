'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMyListStore, ListStatus, SavedItem } from '@/store/useMyListStore';
import { LibraryCard } from '@/components/library/LibraryCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FilterSearchInput } from '@/components/shared/FilterSearchInput';
import { getFollowedCollections, getCollectionSuggestions } from '@/services/collections';
import { UserFollowedCollection, CollectionSuggestion } from '@/types/collections';
import { FollowedCollectionCard } from '@/components/collections/FollowedCollectionCard';
import { CollectionSuggestionCard } from '@/components/collections/CollectionSuggestionCard';
import {
  getFollowedUniverses,
  getUniverseSuggestions,
  getDismissedUniverseSuggestions,
  restoreUniverseSuggestion,
} from '@/services/universes';
import { UserFollowedUniverse, UniverseSuggestion } from '@/types/universes';
import { FollowedUniverseCard } from '@/components/universes/FollowedUniverseCard';
import { UniverseSuggestionCard } from '@/components/universes/UniverseSuggestionCard';
import { Layers, Globe, Compass, Star, StarOff, CheckCircle2, Clock, Play, Heart, Sparkles, ChevronDown, ChevronUp, Search, X, EyeOff, ArrowUpDown, LayoutGrid, Film, Tv, Bookmark, Check } from 'lucide-react';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { cn } from '@/lib/utils';

const VALID_TABS = ['all', 'movie', 'tv', 'collections', 'universes'] as const;
type MediaTabType = (typeof VALID_TABS)[number];

const VALID_SORTS = ['recent', 'rating_desc', 'rating_asc', 'release_date_desc', 'release_date_asc', 'title_asc', 'title_desc'] as const;
export type SortByType = (typeof VALID_SORTS)[number];

const VALID_STATUSES = ['all', 'plan_to_watch', 'watching', 'completed', 'dropped', 'upcoming'] as const;
type StatusFilterType = (typeof VALID_STATUSES)[number];

const VALID_RATINGS = ['all', 'unrated', 'rated'] as const;
type RatingFilterType = (typeof VALID_RATINGS)[number];

const VALID_PROGRESS = ['all', 'up_to_date', 'pending'] as const;
type ProgressFilterType = (typeof VALID_PROGRESS)[number];

function MyListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const sortParam = searchParams.get('sort');
  const statusParam = searchParams.get('status');
  const ratingParam = searchParams.get('rating');
  const progressParam = searchParams.get('progress');
  const favoriteParam = searchParams.get('favorites') === 'true';

  const { items, isLoading, fetchMyList } = useMyListStore();
  const [mediaTab, setMediaTab] = useState<MediaTabType>(() => {
    return VALID_TABS.includes(tabParam as any) ? (tabParam as MediaTabType) : 'all';
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(() => {
    return VALID_STATUSES.includes(statusParam as any) ? (statusParam as StatusFilterType) : 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>(() => {
    return VALID_SORTS.includes(sortParam as any) ? (sortParam as SortByType) : 'recent';
  });
  const [isSuggestionsBannerDismissed, setIsSuggestionsBannerDismissed] = useState(false);

  // Sub-filters for rating & progress & favorites inicializados a partir da URL
  const [ratingFilter, setRatingFilter] = useState<RatingFilterType>(() => {
    return VALID_RATINGS.includes(ratingParam as any) ? (ratingParam as RatingFilterType) : 'all';
  });
  const [watchProgressFilter, setWatchProgressFilter] = useState<ProgressFilterType>(() => {
    return VALID_PROGRESS.includes(progressParam as any) ? (progressParam as ProgressFilterType) : 'all';
  });
  const [favoriteFilter, setFavoriteFilter] = useState<boolean>(() => favoriteParam);

  // Collections & Suggestions state
  const [collections, setCollections] = useState<UserFollowedCollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [suggestions, setSuggestions] = useState<CollectionSuggestion[]>([]);
  const [, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(false);
  const [collectionsFilter, setCollectionsFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [collectionsSort, setCollectionsSort] = useState<'recent' | 'progress_desc' | 'name_asc'>('recent');

  // Universes & Suggestions state
  const [universes, setUniverses] = useState<UserFollowedUniverse[]>([]);
  const [isLoadingUniverses, setIsLoadingUniverses] = useState(false);
  const [universeSuggestions, setUniverseSuggestions] = useState<UniverseSuggestion[]>([]);
  const [, setIsLoadingUniverseSuggestions] = useState(false);
  const [isUniverseSuggestionsCollapsed, setIsUniverseSuggestionsCollapsed] = useState(false);
  const [showAllUniverseSuggestions, setShowAllUniverseSuggestions] = useState(false);
  const [universesFilter, setUniversesFilter] = useState<'all' | 'in_progress' | 'completed'>(() => {
    if (statusParam === 'completed') return 'completed';
    if (statusParam === 'watching' || statusParam === 'in_progress') return 'in_progress';
    return 'all';
  });
  const [universesSort, setUniversesSort] = useState<'recent' | 'progress_desc' | 'name_asc'>('recent');
  const [dismissedUniverses, setDismissedUniverses] = useState<UniverseSuggestion[]>([]);
  const [isDismissedUniversesOpen, setIsDismissedUniversesOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('omniwatch_suggestions_collapsed');
      if (saved !== null) {
        queueMicrotask(() => {
          setIsSuggestionsCollapsed(saved === 'true');
        });
      }
      const savedUniv = localStorage.getItem('omniwatch_universe_suggestions_collapsed');
      if (savedUniv !== null) {
        queueMicrotask(() => {
          setIsUniverseSuggestionsCollapsed(savedUniv === 'true');
        });
      }
      const savedBannerDismissed = localStorage.getItem('omniwatch_suggestions_banner_dismissed');
      if (savedBannerDismissed === 'true') {
        queueMicrotask(() => {
          setIsSuggestionsBannerDismissed(true);
        });
      }
    } catch (e) {
      console.error('Failed to read suggestions collapsed state from localStorage', e);
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'omniwatch_suggestions_collapsed' && e.newValue !== null) {
        setIsSuggestionsCollapsed(e.newValue === 'true');
      }
      if (e.key === 'omniwatch_universe_suggestions_collapsed' && e.newValue !== null) {
        setIsUniverseSuggestionsCollapsed(e.newValue === 'true');
      }
      if (e.key === 'omniwatch_suggestions_banner_dismissed' && e.newValue !== null) {
        setIsSuggestionsBannerDismissed(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDismissSuggestionsBanner = () => {
    setIsSuggestionsBannerDismissed(true);
    try {
      localStorage.setItem('omniwatch_suggestions_banner_dismissed', 'true');
    } catch (e) {
      console.error('Failed to save suggestions banner dismissed state to localStorage', e);
    }
  };

  const toggleSuggestionsCollapsed = () => {
    setIsSuggestionsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('omniwatch_suggestions_collapsed', String(next));
      } catch (e) {
        console.error('Failed to save suggestions collapsed state to localStorage', e);
      }
      return next;
    });
  };

  const toggleUniverseSuggestionsCollapsed = () => {
    setIsUniverseSuggestionsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('omniwatch_universe_suggestions_collapsed', String(next));
      } catch (e) {
        console.error('Failed to save universe suggestions collapsed state to localStorage', e);
      }
      return next;
    });
  };

  useEffect(() => {
    fetchMyList();
  }, [fetchMyList]);

  const loadCollections = useCallback(async () => {
    try {
      setIsLoadingCollections(true);
      const data = await getFollowedCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      setIsLoadingSuggestions(true);
      const data = await getCollectionSuggestions();
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load collection suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const loadUniverses = useCallback(async () => {
    try {
      setIsLoadingUniverses(true);
      const data = await getFollowedUniverses();
      setUniverses(data);
    } catch (err) {
      console.error('Failed to load universes:', err);
    } finally {
      setIsLoadingUniverses(false);
    }
  }, []);

  const loadUniverseSuggestions = useCallback(async () => {
    try {
      setIsLoadingUniverseSuggestions(true);
      const data = await getUniverseSuggestions();
      setUniverseSuggestions(data);
    } catch (err) {
      console.error('Failed to load universe suggestions:', err);
    } finally {
      setIsLoadingUniverseSuggestions(false);
    }
  }, []);

  const loadDismissedUniverses = useCallback(async () => {
    try {
      const data = await getDismissedUniverseSuggestions();
      setDismissedUniverses(data);
    } catch (err) {
      console.error('Failed to load dismissed universe suggestions:', err);
    }
  }, []);

  // Carrega sugestões para preencher os badges das abas desacopladas do carregamento inicial da lista
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuggestions();
      loadUniverseSuggestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadSuggestions, loadUniverseSuggestions]);

  useEffect(() => {
    if (mediaTab === 'collections') {
      loadCollections();
      loadSuggestions();
    } else if (mediaTab === 'universes') {
      loadUniverses();
      loadUniverseSuggestions();
      loadDismissedUniverses();
    }
  }, [mediaTab, loadCollections, loadSuggestions, loadUniverses, loadUniverseSuggestions, loadDismissedUniverses]);

  function handleUnfollowCollection(tmdbId: number) {
    setCollections((prev) => prev.filter((c) => c.tmdb_id !== tmdbId));
  }

  function handleFollowSuggestion(tmdbId: number) {
    setSuggestions((prev) => prev.filter((s) => s.tmdb_id !== tmdbId));
    loadCollections();
    fetchMyList();
  }

  function handleDismissSuggestion(tmdbId: number) {
    setSuggestions((prev) => prev.filter((s) => s.tmdb_id !== tmdbId));
  }

  function handleUnfollowUniverse(universeKey: string) {
    setUniverses((prev) => prev.filter((u) => u.universe_key !== universeKey));
    loadUniverseSuggestions();
    loadDismissedUniverses();
  }

  function handleFollowUniverseSuggestion(universeKey: string) {
    setUniverseSuggestions((prev) => prev.filter((s) => s.universe_key !== universeKey));
    loadUniverses();
    fetchMyList();
  }

  function handleDismissUniverseSuggestion(universeKey: string) {
    setUniverseSuggestions((prev) => prev.filter((s) => s.universe_key !== universeKey));
    loadDismissedUniverses();
  }

  async function handleRestoreUniverse(universeKey: string) {
    try {
      await restoreUniverseSuggestion(universeKey);
      await Promise.all([loadUniverseSuggestions(), loadDismissedUniverses()]);
    } catch (err) {
      console.error('Failed to restore universe suggestion:', err);
    }
  }

  const handleSortChange = (newSort: string) => {
    const nextSort = VALID_SORTS.includes(newSort as any) ? (newSort as SortByType) : 'recent';
    setSortBy(nextSort);
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === 'recent') {
      params.delete('sort');
    } else {
      params.set('sort', nextSort);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  const handleStatusChange = (newStatus: ListStatus | 'all') => {
    const nextStatus = VALID_STATUSES.includes(newStatus as any) ? (newStatus as StatusFilterType) : 'all';
    setStatusFilter(nextStatus);
    setRatingFilter('all');
    setWatchProgressFilter('all');

    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === 'all') {
      params.delete('status');
    } else {
      params.set('status', nextStatus);
    }
    // Sub-filtros redefinidos ao alterar status
    params.delete('rating');
    params.delete('progress');

    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  const handleUniversesFilterChange = (newFilter: 'all' | 'in_progress' | 'completed') => {
    setUniversesFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === 'all') {
      params.delete('status');
    } else {
      params.set('status', newFilter);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  const handleCollectionsFilterChange = (newFilter: 'all' | 'in_progress' | 'completed') => {
    setCollectionsFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === 'all') {
      params.delete('status');
    } else {
      params.set('status', newFilter);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  const handleFavoriteToggle = () => {
    const nextFavorite = !favoriteFilter;
    setFavoriteFilter(nextFavorite);

    const params = new URLSearchParams(searchParams.toString());
    if (nextFavorite) {
      params.set('favorites', 'true');
    } else {
      params.delete('favorites');
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  const handleRatingChange = (newRating: RatingFilterType) => {
    setRatingFilter(newRating);
    const params = new URLSearchParams(searchParams.toString());
    if (newRating === 'all') {
      params.delete('rating');
    } else {
      params.set('rating', newRating);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  const handleProgressChange = (newProgress: ProgressFilterType) => {
    setWatchProgressFilter(newProgress);
    const params = new URLSearchParams(searchParams.toString());
    if (newProgress === 'all') {
      params.delete('progress');
    } else {
      params.set('progress', newProgress);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  const handleMediaTabChange = (val: string) => {
    const nextTab = VALID_TABS.includes(val as any) ? (val as MediaTabType) : 'all';
    setMediaTab(nextTab);
    setRatingFilter('all');
    setWatchProgressFilter('all');

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', nextTab);
    }
    params.delete('rating');
    params.delete('progress');

    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/my-list${query}`, { scroll: false });
  };

  // Sync tab with URL search params when user navigates (e.g. back/forward)
  useEffect(() => {
    const currentTabParam = searchParams.get('tab');
    const resolvedTab = VALID_TABS.includes(currentTabParam as any) ? (currentTabParam as MediaTabType) : 'all';
    if (resolvedTab !== mediaTab) {
      setMediaTab(resolvedTab);
    }
  }, [searchParams, mediaTab]);

  // Sync sort with URL search params when user navigates (e.g. back/forward)
  useEffect(() => {
    const currentSortParam = searchParams.get('sort');
    const resolvedSort = VALID_SORTS.includes(currentSortParam as any) ? (currentSortParam as SortByType) : 'recent';
    if (resolvedSort !== sortBy) {
      setSortBy(resolvedSort);
    }
  }, [searchParams, sortBy]);

  // Sync status with URL search params when user navigates (e.g. back/forward)
  useEffect(() => {
    const currentStatusParam = searchParams.get('status');
    const resolvedStatus = VALID_STATUSES.includes(currentStatusParam as any) ? (currentStatusParam as StatusFilterType) : 'all';
    if (resolvedStatus !== statusFilter) {
      setStatusFilter(resolvedStatus);
    }
    if (currentStatusParam === 'completed') {
      setUniversesFilter('completed');
      setCollectionsFilter('completed');
    } else if (currentStatusParam === 'in_progress' || currentStatusParam === 'watching') {
      setUniversesFilter('in_progress');
      setCollectionsFilter('in_progress');
    } else if (!currentStatusParam || currentStatusParam === 'all') {
      setUniversesFilter('all');
      setCollectionsFilter('all');
    }
  }, [searchParams, statusFilter]);

  // Sync favorites with URL search params when user navigates (e.g. back/forward)
  useEffect(() => {
    const resolvedFav = searchParams.get('favorites') === 'true';
    if (resolvedFav !== favoriteFilter) {
      setFavoriteFilter(resolvedFav);
    }
  }, [searchParams, favoriteFilter]);

  // Sync rating filter with URL search params
  useEffect(() => {
    const currentRatingParam = searchParams.get('rating');
    const resolvedRating = VALID_RATINGS.includes(currentRatingParam as any) ? (currentRatingParam as RatingFilterType) : 'all';
    if (resolvedRating !== ratingFilter) {
      setRatingFilter(resolvedRating);
    }
  }, [searchParams, ratingFilter]);

  // Sync progress filter with URL search params
  useEffect(() => {
    const currentProgressParam = searchParams.get('progress');
    const resolvedProgress = VALID_PROGRESS.includes(currentProgressParam as any) ? (currentProgressParam as ProgressFilterType) : 'all';
    if (resolvedProgress !== watchProgressFilter) {
      setWatchProgressFilter(resolvedProgress);
    }
  }, [searchParams, watchProgressFilter]);

  // Convert dictionary to array for mapping and guarantee unique items
  const itemsArray = useMemo(() => {
    const seen = new Set<string>();
    const list: SavedItem[] = [];
    for (const item of Object.values(items)) {
      if (!item || (!item.tmdb_id && !item.id)) continue;
      const key = `${item.media_type || 'movie'}_${item.tmdb_id || item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }
    return list;
  }, [items]);

  // Base items for the active mediaTab (all, movie, tv) and search (used to calculate status counts)
  const mediaFilteredItems = useMemo(() => {
    return itemsArray.filter((item) => {
      if (!item || (!item.tmdb_id && !item.id)) return false;
      if (mediaTab !== 'all' && item.media_type !== mediaTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!(item.title || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [itemsArray, mediaTab, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: mediaFilteredItems.length,
      plan_to_watch: 0,
      upcoming: 0,
      watching: 0,
      completed: 0,
      dropped: 0,
      favorites: 0,
    };
    for (const item of mediaFilteredItems) {
      if (item.status && counts[item.status as keyof typeof counts] !== undefined) {
        counts[item.status as keyof typeof counts]++;
      }
      if (item.is_favorite) {
        counts.favorites++;
      }
    }
    return counts;
  }, [mediaFilteredItems]);

  // Base filtered by mediaTab, statusFilter, and searchQuery (for counts)
  const baseItems = useMemo(() => {
    return itemsArray.filter((item) => {
      if (!item || (!item.tmdb_id && !item.id)) return false;
      if (mediaTab !== 'all' && item.media_type !== mediaTab) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!(item.title || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [itemsArray, mediaTab, statusFilter, searchQuery]);

  const unratedCount = baseItems.filter((i) => !i.rating || i.rating === 0).length;
  const ratedCount = baseItems.filter((i) => typeof i.rating === 'number' && i.rating > 0).length;
  const upToDateCount = baseItems.filter((i) => i.media_type === 'tv' && i.is_up_to_date === true).length;
  const pendingCount = baseItems.filter((i) => i.media_type === 'tv' && i.is_up_to_date === false).length;
  const favoriteCount = baseItems.filter((i) => i.is_favorite).length;
  const hasSeries = baseItems.some((i) => i.media_type === 'tv');

  // Filter items
  const filteredItems = useMemo(() => {
    return baseItems.filter((item) => {
      // 1. Filter by favorites
      if (favoriteFilter && !item.is_favorite) return false;

      // 2. Filter by rating
      if (ratingFilter === 'unrated' && (item.rating && item.rating > 0)) return false;
      if (ratingFilter === 'rated' && (!item.rating || item.rating === 0)) return false;

      // 3. Filter by watch progress (for watching series)
      if (watchProgressFilter === 'up_to_date' && (!item.is_up_to_date || item.media_type !== 'tv')) return false;
      if (watchProgressFilter === 'pending' && (item.is_up_to_date || item.media_type !== 'tv')) return false;

      return true;
    });
  }, [baseItems, favoriteFilter, ratingFilter, watchProgressFilter]);

  // Filter collections and suggestions by search query, status and sorting
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      if (!searchQuery.trim()) return true;
      return c.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });
  }, [collections, searchQuery]);

  const completedCollectionsCount = useMemo(() => {
    return filteredCollections.filter((c) => c.total_movies > 0 && c.watched_movies === c.total_movies).length;
  }, [filteredCollections]);

  const inProgressCollectionsCount = useMemo(() => {
    return filteredCollections.filter((c) => c.total_movies > 0 && c.watched_movies < c.total_movies).length;
  }, [filteredCollections]);

  const displayedCollections = useMemo(() => {
    let list = [...filteredCollections];

    if (collectionsFilter === 'completed') {
      list = list.filter((c) => c.total_movies > 0 && c.watched_movies === c.total_movies);
    } else if (collectionsFilter === 'in_progress') {
      list = list.filter((c) => c.total_movies > 0 && c.watched_movies < c.total_movies);
    }

    if (collectionsSort === 'progress_desc') {
      list.sort((a, b) => b.completion_percentage - a.completion_percentage);
    } else if (collectionsSort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [filteredCollections, collectionsFilter, collectionsSort]);

  const filteredSuggestions = suggestions.filter((s) => {
    if (!searchQuery.trim()) return true;
    return s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  // Filter universes and universe suggestions by search query, status and sorting
  const filteredUniverses = useMemo(() => {
    return universes.filter((u) => {
      if (!searchQuery.trim()) return true;
      return u.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });
  }, [universes, searchQuery]);

  const completedUniversesCount = useMemo(() => {
    return filteredUniverses.filter((u) => {
      const activeTotal = u.active_items !== undefined ? u.active_items : Math.max(0, u.total_items - (u.ignored_items_count || 0));
      return activeTotal > 0 && u.watched_items >= activeTotal;
    }).length;
  }, [filteredUniverses]);

  const inProgressUniversesCount = useMemo(() => {
    return filteredUniverses.filter((u) => {
      const activeTotal = u.active_items !== undefined ? u.active_items : Math.max(0, u.total_items - (u.ignored_items_count || 0));
      return activeTotal > 0 && u.watched_items < activeTotal;
    }).length;
  }, [filteredUniverses]);

  const displayedUniverses = useMemo(() => {
    let list = [...filteredUniverses];

    if (universesFilter === 'completed') {
      list = list.filter((u) => {
        const activeTotal = u.active_items !== undefined ? u.active_items : Math.max(0, u.total_items - (u.ignored_items_count || 0));
        return activeTotal > 0 && u.watched_items >= activeTotal;
      });
    } else if (universesFilter === 'in_progress') {
      list = list.filter((u) => {
        const activeTotal = u.active_items !== undefined ? u.active_items : Math.max(0, u.total_items - (u.ignored_items_count || 0));
        return activeTotal > 0 && u.watched_items < activeTotal;
      });
    }

    if (universesSort === 'progress_desc') {
      list.sort((a, b) => {
        const totalA = a.active_items !== undefined ? a.active_items : Math.max(0, a.total_items - (a.ignored_items_count || 0));
        const totalB = b.active_items !== undefined ? b.active_items : Math.max(0, b.total_items - (b.ignored_items_count || 0));
        const pctA = totalA > 0 ? a.watched_items / totalA : 0;
        const pctB = totalB > 0 ? b.watched_items / totalB : 0;
        return pctB - pctA;
      });
    } else if (universesSort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [filteredUniverses, universesFilter, universesSort]);

  const filteredUniverseSuggestions = useMemo(() => {
    return universeSuggestions.filter((s) => {
      if (!searchQuery.trim()) return true;
      return s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });
  }, [universeSuggestions, searchQuery]);

  // Sort items according to selected sortBy
  const sortedItems = useMemo(() => {
    if (sortBy === 'recent') return filteredItems;
    return [...filteredItems].sort((a, b) => {
      if (sortBy === 'rating_desc') {
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        if (rA === 0 && rB > 0) return 1;
        if (rB === 0 && rA > 0) return -1;
        if (rB !== rA) return rB - rA;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'rating_asc') {
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        if (rA === 0 && rB > 0) return 1;
        if (rB === 0 && rA > 0) return -1;
        if (rA !== rB) return rA - rB;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'release_date_desc') {
        const dA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dB = b.release_date ? new Date(b.release_date).getTime() : 0;
        if (dA === 0 && dB > 0) return 1;
        if (dB === 0 && dA > 0) return -1;
        if (dB !== dA) return dB - dA;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'release_date_asc') {
        const dA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dB = b.release_date ? new Date(b.release_date).getTime() : 0;
        if (dA === 0 && dB > 0) return 1;
        if (dB === 0 && dA > 0) return -1;
        if (dA !== dB) return dA - dB;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'title_desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });
  }, [filteredItems, sortBy]);

  // Pré-carrega em segundo plano os pôsteres dos itens não visíveis (a partir do 13º card)
  const posterPathsToPreload = sortedItems.map((item) => item.poster_path);
  useImagePreloader(posterPathsToPreload, { initialSkip: 12, batchSize: 4 });

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Biblioteca</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gerencie seus filmes, séries, coleções e universos acompanhados
          </p>
        </div>

        {/* Campo de Busca Redesenhado */}
        <div className="w-full sm:w-80 md:w-96">
          <FilterSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              mediaTab === 'collections'
                ? "Buscar coleções..."
                : mediaTab === 'universes'
                ? "Buscar universos..."
                : mediaTab === 'movie'
                ? "Buscar filmes na biblioteca..."
                : mediaTab === 'tv'
                ? "Buscar séries na biblioteca..."
                : "Buscar na biblioteca..."
            }
            showCount={Boolean(searchQuery.trim())}
            resultCount={
              mediaTab === 'collections'
                ? filteredCollections.length
                : mediaTab === 'universes'
                ? filteredUniverses.length
                : filteredItems.length
            }
            totalCount={
              mediaTab === 'collections'
                ? collections.length
                : mediaTab === 'universes'
                ? universes.length
                : baseItems.length
            }
          />
        </div>
      </div>

      <Tabs
        value={mediaTab}
        onValueChange={handleMediaTabChange}
        className="w-full mb-8"
      >
        <TabsList
          variant="line"
          className="mb-6 flex flex-nowrap overflow-x-auto no-scrollbar w-full border-b border-border/60 justify-start gap-1 sm:gap-4 px-1"
          aria-label="Categorias de mídia da lista"
        >
          <TabsTrigger
            value="all"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer"
            role="tab"
            aria-label="Ver todos os itens da lista"
            aria-selected={mediaTab === 'all'}
            aria-controls="panel-all"
            id="tab-all"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Todos</span>
          </TabsTrigger>
          <TabsTrigger
            value="movie"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer"
            role="tab"
            aria-label="Filtrar apenas filmes"
            aria-selected={mediaTab === 'movie'}
            aria-controls="panel-movie"
            id="tab-movie"
          >
            <Film className="w-4 h-4" />
            <span>Filmes</span>
          </TabsTrigger>
          <TabsTrigger
            value="tv"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer"
            role="tab"
            aria-label="Filtrar apenas séries"
            aria-selected={mediaTab === 'tv'}
            aria-controls="panel-tv"
            id="tab-tv"
          >
            <Tv className="w-4 h-4" />
            <span>Séries</span>
          </TabsTrigger>
          <TabsTrigger
            value="collections"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-1.5"
            role="tab"
            aria-label="Ver coleções seguidas e sugestões"
            aria-selected={mediaTab === 'collections'}
            aria-controls="panel-collections"
            id="tab-collections"
          >
            <Layers className="w-4 h-4" />
            <span>Coleções</span>
            {suggestions.length > 0 && (
              <span
                title={`${suggestions.length} sugestões de coleções`}
                className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30"
              >
                {suggestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="universes"
            className="min-h-[44px] text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-1.5"
            role="tab"
            aria-label="Ver universos seguidos e sugestões"
            aria-selected={mediaTab === 'universes'}
            aria-controls="panel-universes"
            id="tab-universes"
          >
            <Globe className="w-4 h-4" />
            <span>Universos</span>
            {universeSuggestions.length > 0 && (
              <span
                title={`${universeSuggestions.length} sugestões de universos`}
                className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/15 text-purple-500 dark:text-purple-400 border border-purple-500/30"
              >
                {universeSuggestions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Banner Compacto e Descartável de Sagas e Universos Detectados (Opção A) */}
      {!isSuggestionsBannerDismissed &&
        mediaTab !== 'collections' &&
        mediaTab !== 'universes' &&
        (suggestions.length > 0 || universeSuggestions.length > 0) && (
          <div className="mb-6 p-3 sm:p-3.5 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                  <span>Sagas e Universos Detectados:</span>
                  {suggestions.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {suggestions.length} {suggestions.length === 1 ? 'Coleção' : 'Coleções'}
                    </span>
                  )}
                  {universeSuggestions.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {universeSuggestions.length} {universeSuggestions.length === 1 ? 'Universo' : 'Universos'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  Identificamos franquias completas conectadas às obras da sua biblioteca.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {suggestions.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-amber-500/40 cursor-pointer font-medium shadow-sm"
                  onClick={() => handleMediaTabChange('collections')}
                >
                  Ver Coleções →
                </Button>
              )}
              {universeSuggestions.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-purple-500/40 cursor-pointer font-medium shadow-sm"
                  onClick={() => handleMediaTabChange('universes')}
                >
                  Ver Universos →
                </Button>
              )}
              <button
                type="button"
                onClick={handleDismissSuggestionsBanner}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
                title="Dispensar aviso"
                aria-label="Dispensar aviso de sugestões"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      {mediaTab === 'universes' ? (
        <div className="space-y-8">
          {/* Seção de Sugestões de Universos (Sólido, adaptativo ao tema, com limite de 6 cards) */}
          {(filteredUniverseSuggestions.length > 0 || dismissedUniverses.length > 0) && (
            <div
              className={cn(
                "bg-card border border-border/80 rounded-2xl shadow-sm transition-all duration-300",
                isUniverseSuggestionsCollapsed ? "p-4 sm:p-5 hover:border-border" : "p-5 sm:p-6"
              )}
            >
              <div
                className={cn(
                  "flex justify-between gap-3 sm:gap-4",
                  isUniverseSuggestionsCollapsed ? "items-center cursor-pointer select-none" : "flex-col sm:flex-row items-start mb-5"
                )}
                onClick={isUniverseSuggestionsCollapsed ? toggleUniverseSuggestionsCollapsed : undefined}
                role={isUniverseSuggestionsCollapsed ? "button" : undefined}
                tabIndex={isUniverseSuggestionsCollapsed ? 0 : undefined}
                onKeyDown={isUniverseSuggestionsCollapsed ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleUniverseSuggestionsCollapsed(); } } : undefined}
              >
                <div className={cn("flex gap-3", isUniverseSuggestionsCollapsed ? "items-center" : "items-start")}>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Globe className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground flex flex-wrap items-center gap-2">
                      Sugestões de Universos
                      {filteredUniverseSuggestions.length > 0 ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {filteredUniverseSuggestions.length} {filteredUniverseSuggestions.length === 1 ? 'identificado' : 'identificados'}
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {dismissedUniverses.length} {dismissedUniverses.length === 1 ? 'dispensado' : 'dispensados'}
                        </span>
                      )}
                    </h3>
                    {!isUniverseSuggestionsCollapsed && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Baseado nos seus filmes e séries, encontramos universos compartilhados (múltiplas sagas, spin-offs e séries conectadas). Siga o universo para acompanhar tudo!
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUniverseSuggestionsCollapsed();
                  }}
                  className="bg-card hover:bg-accent text-foreground border border-border shadow-sm text-xs shrink-0 cursor-pointer font-medium gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg transition-all"
                  aria-controls="universe-suggestions-content"
                >
                  <span className="font-semibold">{isUniverseSuggestionsCollapsed ? 'Mostrar Sugestões' : 'Ocultar Sugestões'}</span>
                  {isUniverseSuggestionsCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {!isUniverseSuggestionsCollapsed && (
                <div id="universe-suggestions-content" className="space-y-4 animate-in fade-in duration-200">
                  {filteredUniverseSuggestions.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {(showAllUniverseSuggestions
                          ? filteredUniverseSuggestions
                          : filteredUniverseSuggestions.slice(0, 6)
                        ).map((suggestion) => (
                          <UniverseSuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            onFollow={handleFollowUniverseSuggestion}
                            onDismiss={handleDismissUniverseSuggestion}
                          />
                        ))}
                      </div>

                      {filteredUniverseSuggestions.length > 6 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllUniverseSuggestions(!showAllUniverseSuggestions)}
                            className="gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-border/80 hover:bg-accent cursor-pointer"
                          >
                            <span>
                              {showAllUniverseSuggestions
                                ? 'Mostrar menos sugestões'
                                : `Ver mais sugestões (+${filteredUniverseSuggestions.length - 6})`}
                            </span>
                            {showAllUniverseSuggestions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {dismissedUniverses.length > 0 && (
                    <div className={cn("pt-2", filteredUniverseSuggestions.length > 0 ? "border-t border-border/60" : "")}>
                      <button
                        type="button"
                        onClick={() => setIsDismissedUniversesOpen(!isDismissedUniversesOpen)}
                        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>
                          {isDismissedUniversesOpen ? "Ocultar" : "Ver"} sugestões de universos dispensadas ({dismissedUniverses.length})
                        </span>
                        {isDismissedUniversesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isDismissedUniversesOpen && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dismissedUniverses.map((du) => (
                            <div
                              key={du.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-xs gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="font-semibold text-foreground truncate">{du.name}</h5>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {du.items_in_list} de {du.total_items} obras na sua lista
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Link href={`/universe/${encodeURIComponent(du.universe_key)}`}>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 cursor-pointer">
                                    Ver
                                  </Button>
                                </Link>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleRestoreUniverse(du.universe_key)}
                                  className="h-7 text-xs px-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 cursor-pointer"
                                >
                                  Restaurar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Seção de Universos Seguidos */}
          {isLoadingUniverses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 bg-muted rounded-xl" />
              ))}
            </div>
          ) : universes.length === 0 ? (
            universeSuggestions.length > 0 ? (
              <div className="text-center py-10 bg-card/40 border border-border/40 rounded-xl p-6">
                <p className="text-sm text-muted-foreground">
                  Você ainda não segue nenhum universo. Comece seguindo uma das sugestões acima para adicionar todos os filmes e séries conectados!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-secondary/60 flex items-center justify-center mb-4 text-muted-foreground">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum universo seguido</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Adicione filmes ou séries de grandes franquias (como Marvel, Invocação do Mal, Breaking Bad ou Harry Potter) à sua lista para receber sugestões automáticas de universos completos.
                </p>
                <Link href="/explore">
                  <Button className="gap-2 cursor-pointer">
                    <Compass className="w-4 h-4" />
                    Explorar Títulos
                  </Button>
                </Link>
              </div>
            )
          ) : (
            <div>
              {/* Barra de Ferramentas dos Universos Seguidos (Filtros & Ordenação) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 border border-border/80 p-2 sm:p-2.5 rounded-2xl shadow-sm mb-6">
                {/* Segmented Control */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 bg-background/80 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => handleUniversesFilterChange('all')}
                    className={cn(
                      "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                      universesFilter === 'all'
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <span>Todos</span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", universesFilter === 'all' ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                      {universes.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUniversesFilterChange('in_progress')}
                    className={cn(
                      "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                      universesFilter === 'in_progress'
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Em Andamento</span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", universesFilter === 'in_progress' ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                      {inProgressUniversesCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUniversesFilterChange('completed')}
                    className={cn(
                      "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                      universesFilter === 'completed'
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluídos</span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", universesFilter === 'completed' ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                      {completedUniversesCount}
                    </span>
                  </button>
                </div>

                {/* Ordenação */}
                <div className="flex items-center gap-1.5 bg-background/80 border border-border/80 px-3 py-1.5 min-h-[36px] rounded-xl text-xs text-muted-foreground self-start md:self-auto shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="hidden sm:inline">Ordenar:</span>
                  <select
                    value={universesSort}
                    onChange={(e) => setUniversesSort(e.target.value as any)}
                    className="bg-transparent text-xs text-foreground font-semibold focus:outline-none cursor-pointer"
                    aria-label="Critério de ordenação dos universos"
                  >
                    <option value="recent" className="bg-popover text-popover-foreground">Recém Adicionados</option>
                    <option value="progress_desc" className="bg-popover text-popover-foreground">Maior Progresso (%)</option>
                    <option value="name_asc" className="bg-popover text-popover-foreground">Nome (A → Z)</option>
                  </select>
                </div>
              </div>

              {displayedUniverses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center max-w-md mx-auto bg-card/40 border border-border/60 rounded-2xl p-6">
                  <Search className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <h3 className="text-base font-semibold text-foreground mb-1">Nenhum universo encontrado</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {searchQuery.trim()
                      ? `Nenhum universo corresponde à pesquisa "${searchQuery}".`
                      : "Nenhum universo no status selecionado."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleUniversesFilterChange('all');
                      setSearchQuery('');
                      setUniversesSort('recent');
                    }}
                    className="cursor-pointer"
                  >
                    Redefinir Filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {displayedUniverses.map((univ) => (
                    <FollowedUniverseCard
                      key={univ.id}
                      universe={univ}
                      onUnfollow={handleUnfollowUniverse}
                      onSyncComplete={loadUniverses}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : mediaTab === 'collections' ? (
        <div className="space-y-6">
          {/* Seção de Sugestões de Franquias (No Topo com Gaveta Inteligente Integrada) */}
          {filteredSuggestions.length > 0 && (
            <div
              className={cn(
                "border border-amber-500/25 rounded-2xl transition-all duration-300 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
                isSuggestionsCollapsed ? "p-3.5 sm:p-4 hover:border-amber-500/40" : "p-5 sm:p-6"
              )}
            >
              <div
                className={cn(
                  "flex justify-between gap-3 sm:gap-4",
                  isSuggestionsCollapsed ? "items-center cursor-pointer select-none" : "flex-col sm:flex-row items-start mb-5"
                )}
                onClick={isSuggestionsCollapsed ? toggleSuggestionsCollapsed : undefined}
                role={isSuggestionsCollapsed ? "button" : undefined}
                tabIndex={isSuggestionsCollapsed ? 0 : undefined}
                onKeyDown={isSuggestionsCollapsed ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSuggestionsCollapsed(); } } : undefined}
              >
                <div className={cn("flex gap-3", isSuggestionsCollapsed ? "items-center" : "items-start")}>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground flex flex-wrap items-center gap-2">
                      Sugestões de Franquias
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                        {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'identificada' : 'identificadas'}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {isSuggestionsCollapsed
                        ? "Identificamos sagas completas baseadas nos seus filmes assistidos e salvos."
                        : "Baseado nos filmes da sua biblioteca, identificamos sagas completas. Siga para acompanhar todos os filmes automaticamente!"}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSuggestionsCollapsed();
                  }}
                  className="bg-card hover:bg-accent text-foreground border border-border shadow-xs text-xs shrink-0 cursor-pointer font-semibold gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-xl transition-all"
                  aria-controls="collection-suggestions-content"
                >
                  <span>{isSuggestionsCollapsed ? 'Ver Sugestões' : 'Ocultar Sugestões'}</span>
                  {isSuggestionsCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {!isSuggestionsCollapsed && (
                <div id="collection-suggestions-content" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
                  {filteredSuggestions.map((suggestion) => (
                    <CollectionSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onFollow={handleFollowSuggestion}
                      onDismiss={handleDismissSuggestion}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seção de Coleções Seguidas (Prioridade Principal) */}
          {isLoadingCollections ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 bg-muted rounded-2xl" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            suggestions.length > 0 ? (
              <div className="text-center py-10 bg-card/60 border border-border/60 rounded-2xl p-6">
                <p className="text-sm text-muted-foreground">
                  Você ainda não possui coleções fixas na sua lista. Comece seguindo uma das sagas sugeridas acima!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
                  <Layers className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Nenhuma coleção seguida</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Ao navegar pelos filmes de sagas como O Poderoso Chefão, John Wick ou Harry Potter, clique em{' '}
                  <strong className="text-foreground">&ldquo;Seguir Coleção&rdquo;</strong> para adicionar e acompanhar
                  todos os filmes automaticamente.
                </p>
                <Link href="/explore">
                  <Button className="gap-2 cursor-pointer font-semibold">
                    <Compass className="w-4 h-4" />
                    Explorar Títulos
                  </Button>
                </Link>
              </div>
            )
          ) : (
            <div>
              {/* Barra de Ferramentas das Coleções Seguidas (Filtros & Ordenação) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 border border-border/80 p-2 sm:p-2.5 rounded-2xl shadow-sm mb-6">
                {/* Segmented Control */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 bg-background/80 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => handleCollectionsFilterChange('all')}
                    className={cn(
                      "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                      collectionsFilter === 'all'
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <span>Todas</span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", collectionsFilter === 'all' ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                      {collections.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCollectionsFilterChange('in_progress')}
                    className={cn(
                      "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                      collectionsFilter === 'in_progress'
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Em Andamento</span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", collectionsFilter === 'in_progress' ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                      {inProgressCollectionsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCollectionsFilterChange('completed')}
                    className={cn(
                      "px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                      collectionsFilter === 'completed'
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluídas</span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", collectionsFilter === 'completed' ? "bg-black/20 text-white font-bold" : "bg-muted text-muted-foreground")}>
                      {completedCollectionsCount}
                    </span>
                  </button>
                </div>

                {/* Ordenação */}
                <div className="flex items-center gap-1.5 bg-background/80 border border-border/80 px-3 py-1.5 min-h-[36px] rounded-xl text-xs text-muted-foreground self-start md:self-auto shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="hidden sm:inline">Ordenar:</span>
                  <select
                    value={collectionsSort}
                    onChange={(e) => setCollectionsSort(e.target.value as any)}
                    className="bg-transparent text-xs text-foreground font-semibold focus:outline-none cursor-pointer"
                    aria-label="Critério de ordenação das coleções"
                  >
                    <option value="recent" className="bg-popover text-popover-foreground">Recém Adicionadas</option>
                    <option value="progress_desc" className="bg-popover text-popover-foreground">Maior Progresso (%)</option>
                    <option value="name_asc" className="bg-popover text-popover-foreground">Nome (A → Z)</option>
                  </select>
                </div>
              </div>

              {displayedCollections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center max-w-md mx-auto bg-card/40 border border-border/60 rounded-2xl p-6">
                  <Search className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <h3 className="text-base font-semibold text-foreground mb-1">Nenhuma coleção encontrada</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {searchQuery.trim()
                      ? `Nenhuma coleção corresponde à pesquisa "${searchQuery}".`
                      : "Nenhuma coleção no status selecionado."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCollectionsFilter('all');
                      setSearchQuery('');
                      setCollectionsSort('recent');
                    }}
                    className="cursor-pointer"
                  >
                    Redefinir Filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCollections.map((col) => (
                    <FollowedCollectionCard
                      key={col.id}
                      collection={col}
                      onUnfollow={handleUnfollowCollection}
                      onSyncComplete={loadCollections}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Barra de Controle de Status e Ferramentas (Segmented Toolbar Integrada - Opção 2) */}
          <div className="mb-6 bg-zinc-900/90 border border-zinc-800/90 p-1.5 sm:p-2 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Segmented Control Scrollável para os Status */}
            <div
              className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 bg-zinc-950/70 rounded-xl border border-zinc-800/60"
              role="tablist"
              aria-label="Filtros de status da lista"
            >
              {/* Todos */}
              <button
                type="button"
                onClick={() => handleStatusChange('all')}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                  statusFilter === 'all' && !favoriteFilter
                    ? "bg-zinc-800 text-white shadow-sm font-bold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                )}
                role="tab"
                aria-selected={statusFilter === 'all' && !favoriteFilter}
              >
                <span>Todos</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    statusFilter === 'all' && !favoriteFilter ? "bg-zinc-700 text-zinc-100 font-bold" : "bg-zinc-900 text-zinc-500"
                  )}
                >
                  {statusCounts.all}
                </span>
              </button>

              {/* Quero Ver */}
              <button
                type="button"
                onClick={() => handleStatusChange('plan_to_watch')}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                  statusFilter === 'plan_to_watch'
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                )}
                role="tab"
                aria-selected={statusFilter === 'plan_to_watch'}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Quero Ver</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    statusFilter === 'plan_to_watch' ? "bg-white/20 text-white font-bold" : "bg-zinc-900 text-zinc-500"
                  )}
                >
                  {statusCounts.plan_to_watch}
                </span>
              </button>

              {/* Aguardando Estreia */}
              <button
                type="button"
                onClick={() => handleStatusChange('upcoming')}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                  statusFilter === 'upcoming'
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                )}
                role="tab"
                aria-selected={statusFilter === 'upcoming'}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Aguardando</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    statusFilter === 'upcoming' ? "bg-white/20 text-white font-bold" : "bg-zinc-900 text-zinc-500"
                  )}
                >
                  {statusCounts.upcoming}
                </span>
              </button>

              {/* Assistindo */}
              <button
                type="button"
                onClick={() => handleStatusChange('watching')}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                  statusFilter === 'watching'
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                )}
                role="tab"
                aria-selected={statusFilter === 'watching'}
              >
                <span className={cn("w-2 h-2 rounded-full", statusFilter === 'watching' ? "bg-white animate-pulse" : "bg-emerald-500")} />
                <span>Assistindo</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    statusFilter === 'watching' ? "bg-white/20 text-white font-bold" : "bg-zinc-900 text-zinc-500"
                  )}
                >
                  {statusCounts.watching}
                </span>
              </button>

              {/* Concluídos */}
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                  statusFilter === 'completed'
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                )}
                role="tab"
                aria-selected={statusFilter === 'completed'}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Concluídos</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    statusFilter === 'completed' ? "bg-white/20 text-white font-bold" : "bg-zinc-900 text-zinc-500"
                  )}
                >
                  {statusCounts.completed}
                </span>
              </button>

              {/* Abandonados */}
              <button
                type="button"
                onClick={() => handleStatusChange('dropped')}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none",
                  statusFilter === 'dropped'
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                )}
                role="tab"
                aria-selected={statusFilter === 'dropped'}
              >
                <span>Abandonados</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    statusFilter === 'dropped' ? "bg-white/20 text-white font-bold" : "bg-zinc-900 text-zinc-500"
                  )}
                >
                  {statusCounts.dropped}
                </span>
              </button>
            </div>

            {/* Controles Laterais (Favoritos + Ordenação integrados na mesma régua) */}
            <div className="flex items-center gap-2 justify-between md:justify-end shrink-0">
              {/* Favoritos Pill */}
              <button
                type="button"
                onClick={handleFavoriteToggle}
                className={cn(
                  "px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none shrink-0",
                  favoriteFilter
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                    : "bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                )}
                title={favoriteFilter ? "Remover filtro de favoritos" : "Mostrar apenas favoritos"}
                aria-pressed={favoriteFilter}
              >
                <Heart className={cn("w-3.5 h-3.5", favoriteFilter ? "fill-rose-400 text-rose-400" : "text-zinc-500")} />
                <span>Favoritos</span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.2 rounded",
                    favoriteFilter ? "bg-rose-500/30 text-rose-300" : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {statusCounts.favorites}
                </span>
              </button>

              {/* Seletor de Ordenação Integrado */}
              <div className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-800 px-3 py-1.5 min-h-[36px] rounded-xl text-xs text-zinc-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="hidden xl:inline text-zinc-400">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none cursor-pointer"
                  aria-label="Critério de ordenação da biblioteca"
                >
                  <option value="recent" className="bg-zinc-950 text-white">Recém Adicionados</option>
                  <option value="rating_desc" className="bg-zinc-950 text-white">Maior Nota (★ 5 → 1)</option>
                  <option value="rating_asc" className="bg-zinc-950 text-white">Menor Nota (★ 1 → 5)</option>
                  <option value="release_date_desc" className="bg-zinc-950 text-white">Lançamento (Mais recentes)</option>
                  <option value="release_date_asc" className="bg-zinc-950 text-white">Lançamento (Mais antigos)</option>
                  <option value="title_asc" className="bg-zinc-950 text-white">Título (A → Z)</option>
                  <option value="title_desc" className="bg-zinc-950 text-white">Título (Z → A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-filtros contextuais elegantes e organizados (Opção 2) */}
          {(statusFilter === 'completed' || statusFilter === 'watching') && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 px-4 mb-6 bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800/80 rounded-2xl animate-in fade-in duration-200">
              {/* Indicador de contexto à esquerda */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-medium">
                <span className={cn("w-2 h-2 rounded-full animate-pulse", statusFilter === 'completed' ? "bg-emerald-500" : "bg-rose-500")} />
                <span className="text-zinc-200 font-semibold">
                  {statusFilter === 'completed'
                    ? `${baseItems.length} concluídos`
                    : `${baseItems.length} em andamento`}
                </span>
                {(ratingFilter !== 'all' || watchProgressFilter !== 'all') && (
                  <span className="text-[11px] text-zinc-500">
                    • Exibindo {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                )}
              </div>

              {/* Controles de Filtro agrupados à direita */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Grupo: Avaliação */}
                <div className="flex items-center bg-zinc-950/90 p-1 rounded-xl border border-zinc-800/80 shadow-inner">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 flex items-center gap-1 select-none">
                    <Star className="w-3 h-3 text-amber-400/90" />
                    <span className="hidden sm:inline">Nota:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRatingChange('all')}
                    className={cn(
                      "px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                      ratingFilter === 'all'
                        ? "bg-zinc-800 text-white font-bold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <span>Todas</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px]",
                        ratingFilter === 'all' ? "bg-zinc-700 text-zinc-100 font-bold" : "bg-zinc-900 text-zinc-500"
                      )}
                    >
                      {baseItems.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRatingChange('unrated')}
                    className={cn(
                      "px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                      ratingFilter === 'unrated'
                        ? "bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20"
                        : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    )}
                  >
                    <StarOff className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Sem nota</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                        ratingFilter === 'unrated'
                          ? "bg-black/20 text-zinc-950"
                          : "bg-amber-400/20 text-amber-300"
                      )}
                    >
                      {unratedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRatingChange('rated')}
                    className={cn(
                      "px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                      ratingFilter === 'rated'
                        ? "bg-zinc-800 text-white font-bold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span>Avaliados</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px]",
                        ratingFilter === 'rated' ? "bg-zinc-700 text-zinc-100 font-bold" : "bg-zinc-900 text-zinc-500"
                      )}
                    >
                      {ratedCount}
                    </span>
                  </button>
                </div>

                {/* Grupo: Progresso de Séries (Apenas em 'Assistindo' se houver séries) */}
                {statusFilter === 'watching' && hasSeries && (
                  <div className="flex items-center bg-zinc-950/90 p-1 rounded-xl border border-zinc-800/80 shadow-inner">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 flex items-center gap-1 select-none">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span className="hidden sm:inline">Progresso:</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleProgressChange('all')}
                      className={cn(
                        "px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                        watchProgressFilter === 'all'
                          ? "bg-zinc-800 text-white font-bold shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      Todas as séries
                    </button>

                    <button
                      type="button"
                      onClick={() => handleProgressChange('pending')}
                      className={cn(
                        "px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                        watchProgressFilter === 'pending'
                          ? "bg-sky-400 text-zinc-950 font-bold shadow-md shadow-sky-400/20"
                          : "text-sky-300 hover:text-sky-200 hover:bg-sky-500/10"
                      )}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Novos eps</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                          watchProgressFilter === 'pending'
                            ? "bg-black/20 text-zinc-950"
                            : "bg-sky-400/20 text-sky-300"
                        )}
                      >
                        {pendingCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleProgressChange('up_to_date')}
                      className={cn(
                        "px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                        watchProgressFilter === 'up_to_date'
                          ? "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20"
                          : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Em dia</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                          watchProgressFilter === 'up_to_date'
                            ? "bg-black/20 text-white"
                            : "bg-emerald-500/20 text-emerald-300"
                        )}
                      >
                        {upToDateCount}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback de busca quando filtros de status não estão em 'completed' ou 'watching' */}
          {searchQuery.trim() && statusFilter !== 'completed' && statusFilter !== 'watching' && (
            <div className="flex items-center justify-between mb-6 text-xs text-muted-foreground bg-secondary/30 px-3.5 py-2 rounded-xl border border-border/40">
              <span>
                Exibindo <strong className="text-foreground">{filteredItems.length}</strong> {filteredItems.length === 1 ? 'resultado' : 'resultados'} para &ldquo;<strong className="text-foreground">{searchQuery}</strong>&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Limpar busca
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-muted rounded-md" />
              ))}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl text-muted-foreground mb-4">
                {searchQuery.trim()
                  ? `Nenhum título encontrado para "${searchQuery}".`
                  : 'Nenhum título encontrado com estes filtros.'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  handleMediaTabChange('all');
                  handleStatusChange('all');
                  setSearchQuery('');
                  handleSortChange('recent');
                  if (favoriteFilter) handleFavoriteToggle();
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5">
              {sortedItems.map((item, index) => {
                if (!item || (!item.tmdb_id && !item.id)) return null;
                const key = item.id || `${item.media_type}_${item.tmdb_id}`;

                return (
                  <LibraryCard
                    key={key}
                    item={item}
                    priority={index < 12}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MyListSkeleton() {
  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 animate-pulse rounded mt-2" />
        </div>
        <div className="w-full sm:w-80 md:w-96 h-10 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="h-10 w-96 bg-muted/80 animate-pulse rounded-lg mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function MyListPage() {
  return (
    <Suspense fallback={<MyListSkeleton />}>
      <MyListContent />
    </Suspense>
  );
}
