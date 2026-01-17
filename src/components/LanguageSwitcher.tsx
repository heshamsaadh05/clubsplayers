import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/useLanguage';

const LanguageSwitcher = () => {
  const { currentLanguage, languages, setLanguage, loading } = useLanguage();
  const [open, setOpen] = useState(false);

  if (loading || languages.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLanguage?.native_name || currentLanguage?.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            onClick={() => {
              setLanguage(lang.code);
              setOpen(false);
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{lang.native_name}</span>
            {currentLanguage?.code === lang.code && (
              <Check className="h-4 w-4 text-gold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
