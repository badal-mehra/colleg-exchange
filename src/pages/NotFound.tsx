import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Professional logging for monitoring and debugging purposes
    console.error("MyCampusKart 404 Error: Invalid route accessed at:", location.pathname);
    
    // Optional: Set document title (requires a head management solution like react-helmet)
    // document.title = "404 - Page Not Found | MyCampusKart";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center p-8 bg-white shadow-xl rounded-lg max-w-md w-full">
        <h1 className="mb-2 text-7xl font-extrabold text-indigo-600">404</h1>
        <p className="mb-2 text-3xl font-semibold text-gray-800">Page Not Found</p>
        <p className="mb-8 text-md text-gray-500">
          We couldn't find the page you were looking for. It might have been moved or the URL is incorrect.
        </p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
        >
          &larr; Go Back to MyCampusKart Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
