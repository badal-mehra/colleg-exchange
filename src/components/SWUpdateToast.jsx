import { useEffect, useState } from 'react';

export default function SWUpdateToast() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Check if SW logic exposes a custom event or use standard registration check
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      
      // Handle the update found event
      const handleUpdate = (reg) => {
        setRegistration(reg);
        setNeedsUpdate(true);
      };

      // We need to pass this function into our registration logic
      // OR assign it to a global window object if using simple registration
      window.onPwaUpdateAvailable = handleUpdate;
    }
  }, []);

  const reloadPage = () => {
    if (!registration || !registration.waiting) return;
    
    // 1. Send message to SW to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // 2. Reload page once the new SW takes control
    // Note: We use a slight delay or listen to controllerchange in main.js
    setNeedsUpdate(false);
    window.location.reload();
  };

  if (!needsUpdate) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 z-[9999] border border-gray-700 animate-slide-up">
      <div>
        <p className="font-bold text-sm">Update Available</p>
        <p className="text-xs text-gray-400">New features are ready.</p>
      </div>
      <button 
        onClick={reloadPage}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}
