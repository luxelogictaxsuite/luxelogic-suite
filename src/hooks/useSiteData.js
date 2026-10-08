import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useSiteLinks() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['siteLinks'],
    queryFn: () => base44.entities.SiteLink.list('key', 200),
  });
  const map = Object.fromEntries(data.map((l) => [l.key, l]));
  return { links: map, isLoading };
}

export function useSettings() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSetting.list('key', 100),
  });
  const map = Object.fromEntries(data.map((s) => [s.key, s.value]));
  return { settings: map, isLoading };
}