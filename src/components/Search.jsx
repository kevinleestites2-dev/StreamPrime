import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';

export default function Search({ onSearch }) {
  const [val, setVal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (val.trim()) onSearch(val);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <input 
        type="text" 
        value={val} 
        onChange={(e) => setVal(e.target.value)}
        placeholder="Search Library..."
        className="w-full bg-pantheon-dark border border-pantheon-gold/20 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:border-pantheon-gold/60 transition-all placeholder:text-gray-600 font-medium"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-pantheon-gold/50 group-focus-within:text-pantheon-gold transition-colors">
        <SearchIcon size={18} />
      </div>
    </form>
  );
}
