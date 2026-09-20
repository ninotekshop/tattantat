import { MarketplaceHome } from '../components/MarketplaceHome';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === 'string' ? params[key] : '';
  return <MarketplaceHome query={value('q')} group={value('category')} sort={value('sort')} view={value('view')} />;
}
