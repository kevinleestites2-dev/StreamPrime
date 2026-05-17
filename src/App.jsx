import React, { useState } from 'react';
import Search from './components/Search';
import ResultsGrid from './components/ResultsGrid';
import Player from './components/Player';
import EpisodePicker from './components/EpisodePicker';
import { Film, Tv, LayoutGrid, Zap } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('home'); // home, search, player, episodes
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mode, setMode] = useState('all'); // all, movie, tv, anime

  const handleSearch = (q) => {
    setQuery(q);
    setView('search');
  };

  const openMedia = (item) => {
    setSelectedMedia(item);
    if (item.media_type === 'tv' || item.type === 'ANIME') {
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
              onClick={() => { setMode(m.id); if(view !== 'search') setView('home'); }}
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
      <main className="flex-1 p-6 md:p-12 relative max-w-7xl mx-auto w-full">
        <div className="ember-glow absolute inset-0 pointer-events-none opacity-50" />
        
        {view === 'home' && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-700">
             <div className="space-y-2">
                <h2 className="text-pantheon-gold font-bold tracking-[0.5em] text-sm uppercase">The Pantheon Presents</h2>
                <h1 className="text-6xl md:text-8xl font-black glow-text leading-tight">FORGE OF<br/>CINEMA</h1>
             </div>
             <p className="text-gray-500 uppercase tracking-[0.3em] max-w-md mx-auto text-xs leading-loose">
               Access the complete digital library through the Prime Conduit. Secure connection established.
             </p>
             <button 
              onClick={() => document.querySelector('input').focus()}
              className="bg-pantheon-gold text-black px-10 py-4 rounded-full font-black hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_rgba(255,215,0,0.5)] uppercase tracking-widest text-sm"
             >
               Search the Vault
             </button>
          </div>
        )}

        {view === 'search' && (
          <div className="space-y-8 animate-in fade-in duration-500">
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

        {view === 'episodes' && (
          <EpisodePicker 
            media={selectedMedia} 
            onBack={() => setView('search')} 
            onPlay={playEpisode}
          />
        )}

        {view === 'player' && (
          <Player 
            media={selectedMedia} 
            onBack={() => {
              if (selectedMedia.media_type === 'tv' || selectedMedia.type === 'ANIME') {
                setView('episodes');
              } else {
                setView('search');
              }
            }} 
          />
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden sticky bottom-0 z-50 bg-black/95 border-t border-pantheon-gold/20 flex justify-around p-4 backdrop-blur-xl">
        <button onClick={() => {setMode('movie'); setView('home');}} className={`flex flex-col items-center gap-1 ${mode === 'movie' ? 'text-pantheon-gold' : 'text-gray-500'}`}><Film size={20}/><span className="text-[8px] font-bold">CINEMA</span></button>
        <button onClick={() => {setMode('tv'); setView('home');}} className={`flex flex-col items-center gap-1 ${mode === 'tv' ? 'text-pantheon-gold' : 'text-gray-500'}`}><Tv size={20}/><span className="text-[8px] font-bold">SERIES</span></button>
        <button onClick={() => {setMode('anime'); setView('home');}} className={`flex flex-col items-center gap-1 ${mode === 'anime' ? 'text-pantheon-gold' : 'text-gray-500'}`}><Zap size={20}/><span className="text-[8px] font-bold">ANIME</span></button>
        <button onClick={() => {setMode('all'); setView('home');}} className={`flex flex-col items-center gap-1 ${mode === 'all' ? 'text-pantheon-gold' : 'text-gray-500'}`}><LayoutGrid size={20}/><span className="text-[8px] font-bold">ALL</span></button>
      </nav>
    </div>
  );
}
