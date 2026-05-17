import React, { useState } from 'react';
import Search from './components/Search';
import ResultsGrid from './components/ResultsGrid';
import Player from './components/Player';
import EpisodePicker from './components/EpisodePicker';
import BrowseRow from './components/BrowseRow';
import { Film, Tv, LayoutGrid, Zap } from 'lucide-react';
import { BROWSE_ROW_COUNT } from './api';

export default function App() {
  const [view, setView] = useState('home'); // home, search, player, episodes
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mode, setMode] = useState('all');

  const handleSearch = (q) => {
    setQuery(q);
    setView('search');
  };

  const openMedia = (item) => {
    setSelectedMedia(item);
    if (item.Type === 'series' || item.Type === 'anime') {
      setView('episodes');
    } else {
      setView('player');
    }
  };

  const playEpisode = (season, episode) => {
    setSelectedMedia({ ...selectedMedia, season, episode });
    setView('player');
  };

  return (
    <div className="min-h-screen flex flex-col bg-pantheon-black text-white selection:bg-pantheon-gold selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-pantheon-gold/20 p-4 md:px-8 flex items-center justify-between">
        <div
          className="text-2xl font-black text-pantheon-gold glow-text cursor-pointer flex items-center gap-2"
          onClick={() => setView('home')}
        >
          <Zap className="fill-current" />
          <span className="hidden sm:inline">StreamPrime 🔱</span>
        </div>

        <div className="hidden lg:flex gap-8 text-[10px] font-bold tracking-[0.2em] text-gray-500">
          {[
            { id: 'all', label: 'ALL ACCESS', icon: <LayoutGrid size={14}/> },
            { id: 'movie', label: 'CINEMA', icon: <Film size={14}/> },
            { id: 'tv', label: 'SERIES', icon: <Tv size={14}/> },
            { id: 'anime', label: 'ANIME', icon: <Zap size={14}/> },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setView('home'); }}
              className={`flex items-center gap-2 transition-colors ${mode === m.id ? 'text-pantheon-gold' : 'hover:text-white'}`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        <Search onSearch={handleSearch} />
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="ember-glow absolute inset-0 pointer-events-none opacity-30" />

        {/* ─── HOME: Netflix-style browse ─── */}
        {view === 'home' && (
          <div className="animate-in fade-in duration-500">
            {/* Hero banner */}
            <div className="relative flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-b from-black via-pantheon-black to-transparent">
              <h2 className="text-pantheon-gold font-bold tracking-[0.5em] text-xs uppercase mb-3">The Pantheon Presents</h2>
              <h1 className="text-5xl md:text-7xl font-black glow-text leading-tight mb-4">FORGE OF<br/>CINEMA</h1>
              <p className="text-gray-500 uppercase tracking-[0.25em] max-w-md mx-auto text-[10px] leading-loose mb-6">
                Secure connection established. Tap anything to watch.
              </p>
              <button
                onClick={() => document.querySelector('input')?.focus()}
                className="bg-pantheon-gold text-black px-8 py-3 rounded-full font-black hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_rgba(255,215,0,0.5)] uppercase tracking-widest text-xs"
              >
                Search the Vault
              </button>
            </div>

            {/* Browse rows */}
            <div className="px-4 md:px-8 pb-8">
              {[...Array(BROWSE_ROW_COUNT)].map((_, i) => (
                <BrowseRow key={i} rowIndex={i} onSelect={openMedia} />
              ))}
            </div>
          </div>
        )}

        {/* ─── SEARCH RESULTS ─── */}
        {view === 'search' && (
          <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-widest border-l-4 border-pantheon-gold pl-4">
                Results for <span className="text-pantheon-gold">"{query}"</span>
              </h2>
              <div className="flex gap-2">
                {['all', 'movie', 'tv', 'anime'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${mode === m ? 'bg-pantheon-gold text-black border-pantheon-gold' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <ResultsGrid query={query} mode={mode} onSelect={openMedia} />
          </div>
        )}

        {/* ─── EPISODE PICKER ─── */}
        {view === 'episodes' && (
          <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <EpisodePicker
              media={selectedMedia}
              onBack={() => setView(query ? 'search' : 'home')}
              onPlay={playEpisode}
            />
          </div>
        )}

        {/* ─── PLAYER ─── */}
        {view === 'player' && (
          <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <Player
              media={selectedMedia}
              onBack={() => {
                if (selectedMedia.Type === 'series' || selectedMedia.Type === 'anime') {
                  setView('episodes');
                } else {
                  setView(query ? 'search' : 'home');
                }
              }}
            />
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden sticky bottom-0 z-50 bg-black/95 border-t border-pantheon-gold/20 flex justify-around p-4 backdrop-blur-xl">
        <button onClick={() => { setMode('movie'); setView('home'); }} className={`flex flex-col items-center gap-1 ${mode === 'movie' && view === 'home' ? 'text-pantheon-gold' : 'text-gray-500'}`}><Film size={20}/><span className="text-[8px] font-bold">CINEMA</span></button>
        <button onClick={() => { setMode('tv'); setView('home'); }} className={`flex flex-col items-center gap-1 ${mode === 'tv' && view === 'home' ? 'text-pantheon-gold' : 'text-gray-500'}`}><Tv size={20}/><span className="text-[8px] font-bold">SERIES</span></button>
        <button onClick={() => { setMode('anime'); setView('home'); }} className={`flex flex-col items-center gap-1 ${mode === 'anime' && view === 'home' ? 'text-pantheon-gold' : 'text-gray-500'}`}><Zap size={20}/><span className="text-[8px] font-bold">ANIME</span></button>
        <button onClick={() => { setMode('all'); setView('home'); }} className={`flex flex-col items-center gap-1 ${mode === 'all' && view === 'home' ? 'text-pantheon-gold' : 'text-gray-500'}`}><LayoutGrid size={20}/><span className="text-[8px] font-bold">ALL</span></button>
      </nav>
    </div>
  );
}
