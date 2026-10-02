import type { Metadata } from 'next';
import { VerticalSearch } from '../../components/vertical/VerticalSearch';

export const metadata: Metadata = { title: 'Mua bán ô tô | Tất Tần Tật', description: 'Mua bán ô tô cũ và mới: lọc theo năm sản xuất, số km, nhiên liệu, hộp số.' };
export default function Page() { return <VerticalSearch kind="vehicle" />; }
