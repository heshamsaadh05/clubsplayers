import { useFavicon } from '@/hooks/useFavicon';

// This component doesn't render anything, it just manages the favicon
const FaviconManager = () => {
  useFavicon();
  return null;
};

export default FaviconManager;
