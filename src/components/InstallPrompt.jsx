import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { canInstall, installApp } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <button 
      onClick={installApp}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg z-50 font-bold"
    >
      Install MyCampusKart 📲
    </button>
  );
}
