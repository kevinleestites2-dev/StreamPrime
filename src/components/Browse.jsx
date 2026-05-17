import React, { useState, useEffect, useCallback } from 'react';
import { posterUrl, discover, MOVIE_GENRES, TV_GENRES, TV_NETWORKS } from '../api';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// ─── Category sections displayed in the Browse tab ────────────────────────────
const SECTIONS = [
  {
    label: '🎬 Movie Genres',
    items: MOVIE_GENRES.map(g => ({ id: `mg_${g.id}`, name: g.name, type: 'movie', genre: g.id })),
  },
  {
    label: '📺 TV Genres',
    items: TV_GENRES.map(g => ({ id: `tg_${g.id}`, name: g.name, type: 'tv', genre: g.id })),
  },
  {
    label: '📡 Networks',
    items: TV_NETWORKS.map(n => ({ id: `net_${n.id}`, name: n.name, type: 'tv', network: n.id })),
  },
  {
    label: '📅 Movies by Decade',
    items: [
      { id: 'dec_m_2020', name: '2020s', type: 'movie', startYear: 2020, endYear: 2029 },
      { id: 'dec_m_2010', name: '2010s', type: 'movie', startYear: 2010, endYear: 2019 },
      { id: 'dec_m_2000', name: '2000s', type: 'movie', startYear: 2000, endYear: 2009 },
      { id: 'dec_m_1990', name: '90s',   type: 'movie', startYear: 1990, endYear: 1999 },
      { id: 'dec_m_1980', name: '80s',   type: 'movie', startYear: 1980, endYear: 1989 },
      { id: 'dec_m_1970', name: '70s',   type: 'movie', startYear: 1970, endYear: 1979 },
      { id: 'dec_m_1960', name: '60s',   type: 'movie', startYear: 1960, endYear: 1969 },
      { id: 'dec_m_1950', name: '50s & Earlier', type: 'movie', startYear: 1900, endYear: 1959 },
    ],
  },
  {
    label: '📅 TV Series by Decade',
    items: [
      { id: 'dec_t_2020', name: '2020s', type: 'tv', startYear: 2020, endYear: 2029 },
      { id: 'dec_t_2010', name: '2010s', type: 'tv', startYear: 2010, endYear: 2019 },
      { id: 'dec_t_2000', name: '2000s', type: 'tv', startYear: 2000, endYear: 2009 },
      { id: 'dec_t_1990', name: '90s',   type: 'tv', startYear: 1990, endYear: 1999 },
      { id: 'dec_t_1980', name: '80s',   type: 'tv', startYear: 1980, endYear: 1989 },
    ],
  },
  {
    label: '🌍 By Language',
    items: [
      { id: 'lang_ja_m',  name: '🇯🇵 Japanese',   type: 'movie', lang: 'ja' },
      { id: 'lang_ko_m',  name: '🇰🇷 Korean',     type: 'movie', lang: 'ko' },
      { id: 'lang_ko_tv', name: '🇰🇷 K-Dramas',   type: 'tv',    lang: 'ko' },
      { id: 'lang_ja_tv', name: '🇯🇵 Anime (JP)',  type: 'tv',    lang: 'ja' },
      { id: 'lang_es_m',  name: '🇪🇸 Spanish',    type: 'movie', lang: 'es' },
      { id: 'lang_fr_m',  name: '🇫🇷 French',     type: 'movie', lang: 'fr' },
      { id: 'lang_hi_m',  name: '🇮🇳 Hindi',      type: 'movie', lang: 'hi' },
      { id: 'lang_it_m',  name: '🇮🇹 Italian',    type: 'movie', lang: 'it' },
      { id: 'lang_de_m',  name: '🇩🇪 German',     type: 'movie', lang: 'de' },
      { id: 'lang_pt_m',  name: '🇧🇷 Portuguese', type: 'movie', lang: 'pt' },
      { id: 'lang_zh_m',  name: '🇨🇳 Chinese',    type: 'movie', lang: 'zh' },
      { id: 'lang_ru_m',  name: '🇷🇺 Russian',    type: 'movie', lang: 'ru' },
      { id: 'lang_ar_m',  name: '🌙 Arabic',      type: 'movie', lang: 'ar' },
    ],
  },
  {
    label: '🏢 Studios',
    items: [
      { id: 'co_marvel',     name: '🕷️ Marvel',        type: 'movie', company: 420   },
      { id: 'co_dc',         name: '🦇 DC',             type: 'movie', company: 9993  },
      { id: 'co_pixar',      name: '🎈 Pixar',          type: 'movie', company: 3     },
      { id: 'co_disney',     name: '🏰 Walt Disney',    type: 'movie', company: 2     },
      { id: 'co_wb',         name: '🎬 Warner Bros',    type: 'movie', company: 174   },
      { id: 'co_universal',  name: '🌍 Universal',      type: 'movie', company: 33    },
      { id: 'co_sony',       name: '🎥 Sony',           type: 'movie', company: 5     },
      { id: 'co_a24',        name: '🎭 A24',            type: 'movie', company: 41077 },
      { id: 'co_paramount',  name: '⛰️ Paramount',      type: 'movie', company: 4     },
      { id: 'co_dreamworks', name: '🌊 DreamWorks',     type: 'movie', company: 521   },
      { id: 'co_blumhouse',  name: '😱 Blumhouse',      type: 'movie', company: 3172  },
    ],
  },
];

// Build discover params from a category item
const buildParams = (cat) => {
  const params = { sort_by: 'popularity.desc' };
  if (cat.genre)     params.with_genres   = cat.genre;
  if (cat.network)   params.with_networks = cat.network;
  if (cat.company)   params.with_companies = cat.company;
  if (cat.lang)      params.with_original_language = cat.lang;
  if (cat.startYear) {
    if (cat.type === 'movie') {
      params['primary_release_date.gte'] = `${cat.startYear}-01-01`;
      params['primary_release_date.lte'] = `${cat.endYear}-12-31`;
    } else {
      params['first_air_date.gte'] = `${cat.startYear}-01-01`;
      params['first_air_date.lte'] = `${cat.endYear}-12-31`;
    }
  }
  return params;
};

// ─── Results grid with pagination ────────────────────────────────────────────
function CategoryGrid({ cat, onSelect, onBack }) {
  const [page, setPage]         = useState(1);
  const [items, setItems]       = useState([]);
  const [totalPages, setTotal]  = useState(1);
  const [loading, setLoading]   = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    const params = buildParams(cat);
    const { results, totalPages: tp } = await discover(cat.type, params, p);
    setItems(results);
    setTotal(tp);
    setLoading(false);
    window.scrollTo(0, 0);
  }, [cat]);

  useEffect(() => { load(1); setPage(1); }, [load]);

  const go = (p) => { setPage(p); load(p); };

  return (
    <div>
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-pantheon-gold text-sm font-bold hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <h2 className="text-2xl font-black text-white">{cat.name}</h2>
        <span className="text-xs text-gray-500 uppercase tracking-wider ml-auto">
          Page {page} of {Math.min(totalPages, 500)}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-pantheon-gold" size={40} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 mb-8">
            {items.map(item => {
              const title  = item.title || item.name || 'Untitled';
              const poster = posterUrl(item.poster_path);
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="group relative rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-pantheon-gold transition-all"
                >
                  {poster ? (
                    <img src={poster} alt={title} className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center bg-white/10 text-gray-500 text-xs px-2 text-center">{title}</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] font-bold line-clamp-2">{title}</p>
                    {item.vote_average > 0 && (
                      <p className="text-pantheon-gold text-[10px]">⭐ {item.vote_average.toFixed(1)}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => go(1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-white/10 rounded-lg disabled:opacity-30 hover:bg-pantheon-gold/20 transition-colors"
            >
              ⏮ First
            </button>
            <button
              onClick={() => go(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-white/10 rounded-lg disabled:opacity-30 hover:bg-pantheon-gold/20 transition-colors"
            >
              <ChevronLeft size={14} className="inline" /> Prev
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => go(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    p === page
                      ? 'bg-pantheon-gold text-black font-black'
                      : 'bg-white/10 hover:bg-pantheon-gold/20'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => go(page + 1)}
              disabled={page >= Math.min(totalPages, 500)}
              className="px-3 py-1.5 text-xs bg-white/10 rounded-lg disabled:opacity-30 hover:bg-pantheon-gold/20 transition-colors"
            >
              Next <ChevronRight size={14} className="inline" />
            </button>
            <button
              onClick={() => go(Math.min(totalPages, 500))}
              disabled={page >= Math.min(totalPages, 500)}
              className="px-3 py-1.5 text-xs bg-white/10 rounded-lg disabled:opacity-30 hover:bg-pantheon-gold/20 transition-colors"
            >
              Last ⏭
            </button>
          </div>
          <p className="text-center text-gray-600 text-xs mt-2">TMDB caps at 500 pages (10,000 results) per filter</p>
        </>
      )}
    </div>
  );
}

// ─── Section chip row ─────────────────────────────────────────────────────────
function SectionRow({ section }) {
  const ref = React.useRef(null);
  return (
    <div className="mb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">{section.label}</h3>
      <div ref={ref} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {section.items.map(cat => (
          <button
            key={cat.id}
            data-cat={JSON.stringify(cat)}
            className="snap-start shrink-0 px-4 py-2 rounded-full text-sm font-bold bg-white/8 border border-white/10 hover:border-pantheon-gold hover:text-pantheon-gold transition-all whitespace-nowrap"
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Browse component ────────────────────────────────────────────────────
export default function Browse({ onSelect }) {
  const [activeCat, setActiveCat] = useState(null);

  const handleClick = (e) => {
    const btn = e.target.closest('[data-cat]');
    if (btn) {
      try { setActiveCat(JSON.parse(btn.dataset.cat)); } catch {}
    }
  };

  if (activeCat) {
    return <CategoryGrid cat={activeCat} onSelect={onSelect} onBack={() => setActiveCat(null)} />;
  }

  return (
    <div onClick={handleClick}>
      <h2 className="text-2xl font-black text-white mb-1">
        Browse Everything
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        1.1M+ movies · 221K+ series · every genre, decade, language, network & studio
      </p>
      {SECTIONS.map(s => <SectionRow key={s.label} section={s} />)}
    </div>
  );
}
