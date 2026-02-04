import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const NotFound = () => {
  const location = useLocation();
  const [meme, setMeme] = useState("");

  // A curated list of relatable memes for students/devs
  const memes = [
    "https://media.giphy.com/media/VbnUQpnihPSlIxe2v3/giphy.gif", // Confused Travolta
    "https://media.giphy.com/media/26hkhKd2Cp5WMWU1O/giphy.gif", // Blinking Guy
    "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif", // This is fine
    "https://media.giphy.com/media/l2JjkYs6j4FhEaMrm/giphy.gif", // Minion what?
    "https://media.giphy.com/media/g7GKcSzwQ5s5i/giphy.gif", // Confused Math Lady
  ];

  useEffect(() => {
    // 1. Log the error for your analytics
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // 2. Pick a random meme on mount
    const random = memes[Math.floor(Math.random() * memes.length)];
    setMeme(random);
  }, [location.pathname]);

  const handleRefreshMeme = () => {
    const random = memes[Math.floor(Math.random() * memes.length)];
    setMeme(random);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-800">
      
      {/* --- Background Floating Blobs Animation --- */}
      <div className="absolute top-0 left-0 -ml-20 -mt-20 h-72 w-72 animate-blob rounded-full bg-purple-300 opacity-30 mix-blend-multiply blur-xl filter"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 animate-blob animation-delay-2000 rounded-full bg-yellow-300 opacity-30 mix-blend-multiply blur-xl filter"></div>
      <div className="absolute -bottom-8 left-20 h-72 w-72 animate-blob animation-delay-4000 rounded-full bg-pink-300 opacity-30 mix-blend-multiply blur-xl filter"></div>

      {/* --- Glassmorphism Card --- */}
      <div className="z-10 mx-4 w-full max-w-2xl rounded-3xl border border-white/20 bg-white/60 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        
        <div className="flex flex-col items-center text-center">
          
          {/* Glitchy 404 Text */}
          <h1 className="relative mb-2 text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 sm:text-9xl hover:scale-110 transition-transform duration-300 cursor-default">
            404
          </h1>

          <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Ghosted by the Server? 👻
          </h2>

          <p className="mb-6 max-w-md text-gray-600">
            We searched the entire marketplace, but we couldn't find 
            <span className="mx-1 rounded bg-red-100 px-2 py-0.5 font-mono text-red-600">
              {location.pathname}
            </span>.
            Maybe it graduated early?
          </p>

          {/* Meme Container */}
          <div className="group relative mb-8 h-64 w-full max-w-md overflow-hidden rounded-2xl border-4 border-white bg-gray-200 shadow-lg">
            {meme && (
              <img
                src={meme}
                alt="Random 404 Meme"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}
            
            {/* Overlay button to change meme */}
            <button 
              onClick={handleRefreshMeme}
              className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              title="Give me another meme"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-blue-600 px-8 py-3 font-medium text-white shadow-lg transition duration-300 hover:bg-blue-700 hover:shadow-blue-500/50"
            >
              <span className="mr-2">🏠</span> Back to Home
              <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full"></div>
            </Link>

            <button
              onClick={() => alert("Thanks! We've noted this dead link.")}
              className="inline-flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-8 py-3 font-medium text-gray-600 transition duration-300 hover:border-red-400 hover:bg-red-50 hover:text-red-500"
            >
              <span className="mr-2">🚩</span> Report Broken Link
            </button>
          </div>

        </div>
      </div>

      <div className="mt-8 text-sm text-gray-400">
        Error Code: 404_NOT_FOUND_ON_CAMPUS
      </div>
    </div>
  );
};

export default NotFound;
