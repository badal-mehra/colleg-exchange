import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      {/* Animated Background Blob (Optional decoration) */}
      <div className="absolute top-10 left-10 h-32 w-32 animate-pulse rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
      <div className="absolute bottom-10 right-10 h-40 w-40 animate-pulse rounded-full bg-purple-100 opacity-50 blur-3xl delay-700"></div>

      <div className="relative z-10 max-w-lg">
        {/* 404 Header with Bounce Animation */}
        <h1 className="mb-2 text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-bounce">
          404
        </h1>

        <h2 className="mb-6 text-3xl font-bold text-gray-800">
          Lost on Campus?
        </h2>

        {/* Relatable Meme/Image Section */}
        <div className="mx-auto mb-8 w-64 overflow-hidden rounded-xl shadow-lg transition-transform hover:scale-105 hover:rotate-2 duration-300">
          {/* Replace this src with a relatable GIF (e.g., John Travolta looking around or a confused cat) */}
          <img
            src="https://media.giphy.com/media/VbnUQpnihPSlIxe2v3/giphy.gif" 
            alt="Confused Travolta Meme"
            className="h-full w-full object-cover"
          />
        </div>

        <p className="mb-8 text-lg text-gray-600">
          We looked everywhere—classrooms, dorms, even the cafeteria. 
          The page <span className="font-mono text-red-500 bg-red-50 px-1 rounded">{location.pathname}</span> 
          doesn't seem to exist.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Link
            to="/"
            className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-blue-500/30"
          >
            Back to Marketplace
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="rounded-full border-2 border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 shadow-md transition-all hover:-translate-y-1 hover:border-gray-400 hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
