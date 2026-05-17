import React, { useState } from 'react';
import Search from './components/Search';
import ResultsGrid from './components/ResultsGrid';
import Player from './components/Player';
import EpisodePicker from './components/EpisodePicker';
import BrowseRow from './components/BrowseRow';
import HeroBanner from './components/HeroBanner';
import Browse from './components/Browse';
import { Film, Tv, Zap, LayoutGrid, Compass } from 'lucide-react';
import { BROWSE_ROW_COUNT, BROWSE_ROWS } from './api';

const TABS = [
  { id: 'all',    label: 'All',    icon: <LayoutGrid size={13} /> },
  { id: 'movie',  label: 'Movies', icon: <Film size={13} />       },
  { id: 'tv',     label: 'Series', icon: <Tv size={13} />         },
  { id: 'anime',  label: 'Anime',  icon: <Zap size={13} />        },
  { id: 'browse', label: 'Browse', icon: <Compass size={13} />    },
];

const MOBILE_TABS = [
  { id: 'all',    label: 'All',    icon: <LayoutGrid size={18} /> },
  { id: 'movie',  label: 'Cinema', icon: <Film size={18} />       },
  { id: 'tv',     label: 'Series', icon: <Tv size={18} />         },
  { id: 'anime',  label: 'Anime',  icon: <Zap size={18} />        },
  { id: 'browse', label: 'Browse', icon: <Compass size={18} />    },
];

export default function App() {
  const [view, setView]                   = useState('home');
  const [query, setQuery]                 = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mode, setMode]                   = useState('all');

  const handleSearch = (q) => {
    setQuery(q);
    if (q.trim()) setView('search');
    else setView('home');
  };

  const openMedia = (item) => {
    setSelectedMedia(item);
    setView(item.media_type === 'tv' || item.media_type === 'anime' ? 'episodes' : 'player');
  };

  const playEpisode = (season, episode) => {
    setSelectedMedia(prev => ({ ...prev, season, episode }));
    setView('player');
  };

  const goHome = () => { setView('home'); setQuery(''); setSelectedMedia(null); };

  const switchMode = (m) => {
    setMode(m);
    setView(m === 'browse' ? 'browse' : 'home');
    setQuery('');
  };

  // Which rows to show based on mode
  const rowFilter = (idx) => {
    const { id } = BROWSE_ROWS[idx] || {};
    if (!id) return false;
    if (mode === 'movie') return !id.startsWith('tv_') && !id.startsWith('net_') && !id.startsWith('lang_kdramas') && !id.startsWith('lang_anime');
    if (mode === 'tv')    return id.startsWith('tv_') || id.startsWith('net_') || id.startsWith('lang_kdramas') || id.startsWith('lang_anime') || id.startsWith('trending_tv') || id === 'on_the_air' || id === 'airing_today' || id === 'popular_tv' || id === 'top_rated_tv' || id === 'best_tv' || id.startsWith('decade') && id.endsWith('tv') || id.startsWith('kw_serial');
    return true; // 'all' shows everything
  };

  return (
    <div className="min-h-screen flex flex-col bg-pantheon-black text-white selection:bg-pantheon-gold selection:text-black">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-pantheon-gold/20 px-4 md:px-8 h-14 flex items-center justify-between gap-4">
        <button
          onClick={goHome}
          className="text-xl font-black text-pantheon-gold tracking-widest uppercase shrink-0 hover:opacity-80 transition-opacity"
          style={{ textShadow: '0 0 15px rgba(255,215,0,0.5)' }}
        >
          ⚡ StreamPrime
        </button>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-1 bg-black/60 border border-white/10 rounded-full px-1 py-1">
          {TABS.map(m => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                mode === m.id
                  ? 'bg-pantheon-gold text-black shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {m.icon}{m.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Search onSearch={handleSearch} />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">

        {/* HOME (all/movie/tv/anime) */}
        {view === 'home' && mode !== 'browse' && (
          <div>
            {(mode === 'all' || mode === 'movie') && <HeroBanner onSelect={openMedia} />}
            {Array.from({ length: BROWSE_ROW_COUNT }, (_, i) =>
              rowFilter(i) ? <BrowseRow key={i} rowIndex={i} onSelect={openMedia} /> : null
            )}
          </div>
        )}

        {/* BROWSE */}
        {(view === 'browse' || mode === 'browse') && view !== 'search' && view !== 'player' && view !== 'episodes' && (
          <Browse onSelect={openMedia} />
        )}

        {/* SEARCH */}
        {view === 'search' && (
          <ResultsGrid query={query} mode={mode === 'browse' ? 'all' : mode} onSelect={openMedia} />
        )}

        {/* EPISODE PICKER */}
        {view === 'episodes' && selectedMedia && (
          <EpisodePicker
            media={selectedMedia}
            onBack={() => setView(query ? 'search' : mode === 'browse' ? 'browse' : 'home')}
            onPlay={playEpisode}
          />
        )}

        {/* PLAYER */}
        {view === 'player' && selectedMedia && (
          <Player
            media={selectedMedia}
            onBack={() => {
              if (selectedMedia.media_type === 'tv' || selectedMedia.media_type === 'anime') {
                setView('episodes');
              } else {
                setView(query ? 'search' : mode === 'browse' ? 'browse' : 'home');
              }
            }}
          />
        )}
      </main>

      {/* ── Mobile Nav ── */}
      <nav className="md:hidden sticky bottom-0 z-50 bg-black/95 border-t border-pantheon-gold/20 flex justify-around py-3 backdrop-blur-xl">
        {MOBILE_TABS.map(m => (
          <button
            key={m.id}
            onClick={() => switchMode(m.id)}
            className={`flex flex-col items-center gap-0.5 transition-all ${
              mode === m.id ? 'text-pantheon-gold scale-110' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {m.icon}
            <span className="text-[8px] font-black uppercase tracking-wider">{m.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
