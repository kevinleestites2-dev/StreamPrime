import React, { useState } from 'react';
import Search from './components/Search';
import ResultsGrid from './components/ResultsGrid';
import Player from './components/Player';
import EpisodePicker from './components/EpisodePicker';
import BrowseRow from './components/BrowseRow';
import HeroBanner from './components/HeroBanner';
import { Film, Tv, Zap, LayoutGrid } from 'lucide-react';
import { BROWSE_ROW_COUNT } from './api';

export default function App() {
  const [view, setView]               = useState('home'); // home | search | player | episodes
  const [query, setQuery]             = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mode, setMode]               = useState('all');  // all | movie | tv | anime

  const handleSearch = (q) => {
    setQuery(q);
    if (q.trim()) setView('search');
    else setView('home');
  };

  const openMedia = (item) => {
    setSelectedMedia(item);
    const isTV    = item.media_type === 'tv';
    const isAnime = item.media_type === 'anime';
    if (isTV || isAnime) {
      setView('episodes');
    } else {
      setView('player');
    }
  };

  const playEpisode = (season, episode) => {
    setSelectedMedia(prev => ({ ...prev, season, episode }));
    setView('player');
  };

  const goHome = () => {
    setView('home');
    setQuery('');
    setSelectedMedia(null);
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

        {/* Desktop mode tabs */}
        <div className="hidden md:flex items-center gap-1 bg-black/60 border border-white/10 rounded-full px-1 py-1">
          {[
            { id: 'all',   label: 'All',    icon: <LayoutGrid size={13} /> },
            { id: 'movie', label: 'Movies', icon: <Film size={13} /> },
            { id: 'tv',    label: 'Series', icon: <Tv size={13} /> },
            { id: 'anime', label: 'Anime',  icon: <Zap size={13} /> },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setView('home'); setQuery(''); }}
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

        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <Search onSearch={handleSearch} />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">

        {/* HOME */}
        {view === 'home' && (
          <div>
            {/* Hero banner — only on "all" or "movie" mode */}
            {(mode === 'all' || mode === 'movie') && (
              <HeroBanner onSelect={openMedia} />
            )}
            {/* Browse rows */}
            {Array.from({ length: BROWSE_ROW_COUNT }, (_, i) => (
              <BrowseRow key={i} rowIndex={i} onSelect={openMedia} />
            ))}
          </div>
        )}

        {/* SEARCH RESULTS */}
        {view === 'search' && (
          <ResultsGrid
            query={query}
            mode={mode}
            onSelect={openMedia}
          />
        )}

        {/* EPISODE PICKER */}
        {view === 'episodes' && selectedMedia && (
          <EpisodePicker
            media={selectedMedia}
            onBack={() => setView(query ? 'search' : 'home')}
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
                setView(query ? 'search' : 'home');
              }
            }}
          />
        )}
      </main>

      {/* ── Mobile Nav ── */}
      <nav className="md:hidden sticky bottom-0 z-50 bg-black/95 border-t border-pantheon-gold/20 flex justify-around py-3 backdrop-blur-xl">
        {[
          { id: 'all',   label: 'All',    icon: <LayoutGrid size={18} /> },
          { id: 'movie', label: 'Cinema', icon: <Film size={18} /> },
          { id: 'tv',    label: 'Series', icon: <Tv size={18} /> },
          { id: 'anime', label: 'Anime',  icon: <Zap size={18} /> },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setView('home'); setQuery(''); }}
            className={`flex flex-col items-center gap-0.5 transition-all ${
              mode === m.id && view === 'home'
                ? 'text-pantheon-gold scale-110'
                : 'text-gray-600 hover:text-gray-400'
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
