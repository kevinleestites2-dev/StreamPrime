import React, { useState, useEffect } from 'react';
import { searchTMDB, searchMovies, searchTV, searchAniList, posterUrl } from '../api';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ResultsGrid({ query, mode, onSelect }) {
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages]   = useState(0);

  useEffect(() => {
    setPage(1);
  }, [query, mode]);

  useEffect(() => {
    if (!query) return;
    const fetchResults = async () => {
      setLoading(true);
      let results = [];
      let total   = 0;
      let pages   = 0;

      if (mode === 'anime') {
        const animeResults = await searchAniList(query);
        results = animeResults.map(a => ({
          id:         `anilist-${a.id}`,
          anilistId:  a.id,
          title:      a.title.english || a.title.romaji,
          poster_path: null,
          _aniPoster:  a.coverImage.large,
          vote_average: a.averageScore ? a.averageScore / 10 : null,
          year:        a.seasonYear || '',
          media_type:  'anime',
          overview:    a.description?.replace(/<[^>]*>?/gm, '') || '',
        }));
        total = results.length;
        pages = 1;
      } else if (mode === 'movie') {
        const r = await searchMovies(query, page);
        results = r.items;
        total   = r.totalResults;
        pages   = r.totalPages;
      } else if (mode === 'tv') {
        const r = await searchTV(query, page);
        results = r.items;
        total   = r.totalResults;
        pages   = r.totalPages;
      } else {
        // all — multi search
        const r = await searchTMDB(query, page);
        results = r.items;
        total   = r.totalResults;
        pages   = r.totalPages;
      }

      setItems(results);
      setTotalResults(total);
      setTotalPages(pages);
      setLoading(false);
    };
    fetchResults();
  }, [query, mode, page]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pantheon-gold"></div>
      <p className="text-gray-600 text-xs uppercase tracking-widest">Scanning the Vault...</p>
    </div>
  );

  if (!loading && items.length === 0 && query) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
      <span className="text-4xl">🔍</span>
      <p className="uppercase tracking-widest text-sm">Nothing found for "{query}"</p>
      <p className="text-xs text-gray-700">Try a different title or switch mode</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {totalResults > 0 && (
        <p className="text-xs text-gray-600 uppercase tracking-widest">
          {totalResults.toLocaleString()} titles found — page {page} of {totalPages}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {items.map((item) => {
          const isTV     = item.media_type === 'tv';
          const isAnime  = item.media_type === 'anime';
          const titleStr = item.title || item.name || 'Untitled';
          const yearStr  = item.year || (item.release_date || item.first_air_date || '').slice(0, 4);
          const ratingVal = item.vote_average ? Number(item.vote_average).toFixed(1) : null;
          const imgSrc   = item._aniPoster || posterUrl(item.poster_path, 'w342');

          return (
            <div
              key={`${item.media_type}-${item.id}`}
              className="group cursor-pointer space-y-2"
              onClick={() => onSelect({
                tmdbId:      item.id,
                anilistId:   item.anilistId,
                media_type:  item.media_type,
                title:       titleStr,
                year:        yearStr,
                rating:      ratingVal,
                overview:    item.overview || '',
                poster_path: item.poster_path,
                _aniPoster:  item._aniPoster,
                backdrop_path: item.backdrop_path,
                genre_ids:   item.genre_ids,
              })}
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5 group-hover:border-pantheon-gold/60 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={titleStr}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-3xl">
                    {isAnime ? '⚔️' : isTV ? '📺' : '🎬'}
                  </div>
                )}

                {ratingVal && (
                  <div className="absolute top-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-pantheon-gold flex items-center gap-0.5">
                    <Star size={9} fill="currentColor" />
                    {ratingVal}
                  </div>
                )}

                <div className="absolute top-2 left-2">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isTV    ? 'bg-blue-500/80 text-white' :
                    isAnime ? 'bg-purple-500/80 text-white' :
                              'bg-pantheon-gold/80 text-black'
                  }`}>
                    {isTV ? 'TV' : isAnime ? 'ANIME' : 'FILM'}
                  </span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <button className="w-full bg-pantheon-gold text-black py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                    ▶ {isTV || isAnime ? 'Watch Series' : 'Watch Now'}
                  </button>
                </div>
              </div>

              <div className="px-0.5">
                <h3 className="font-bold text-xs line-clamp-1 group-hover:text-pantheon-gold transition-colors uppercase tracking-wide">
                  {titleStr}
                </h3>
                <p className="text-[10px] text-gray-600">{yearStr}</p>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:border-pantheon-gold hover:text-pantheon-gold transition-all"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-gray-600 uppercase tracking-widest">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:border-pantheon-gold hover:text-pantheon-gold transition-all"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
