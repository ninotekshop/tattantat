import type { Metadata } from 'next';
import { VerticalSearch } from '../../components/vertical/VerticalSearch';

export const metadata: Metadata = { title: 'Bất động sản — mua bán, cho thuê nhà đất | Tất Tần Tật', description: 'Tìm nhà đất, căn hộ, phòng trọ, mặt bằng, văn phòng. Lọc theo diện tích, số phòng ngủ, pháp lý, hướng; so sánh giá/m² và tính khoản vay.' };
export default function Page() { return <VerticalSearch kind="property" />; }
