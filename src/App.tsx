import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar/index.tsx';
import { useTheme } from '@/hooks/useTheme.ts';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { isLoading: themeLoading } = useTheme();

  useEffect(() => {
    // Wait for theme to load
    if (!themeLoading) {
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [themeLoading]);

  if (isLoading || themeLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-wechat border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <Toaster />
    </>
  );
}

export default App;

