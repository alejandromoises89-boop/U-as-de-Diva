import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="relative w-full py-10 text-center bg-brand-200 shadow-sm">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center">
        {/* Matches the logo style from image */}
        <div className="relative inline-block">
          <h1 className="font-serif text-5xl md:text-7xl text-white tracking-[0.1em] drop-shadow-sm font-normal">
            NAILS
          </h1>
          <h2 className="font-script text-4xl md:text-6xl text-black absolute -bottom-4 right-0 transform translate-x-2 -rotate-6">
            by Diva
          </h2>
        </div>
        <div className="mt-8 w-16 h-0.5 bg-black/80 rounded-full opacity-50"></div>
      </div>
    </header>
  );
};

export default Header;