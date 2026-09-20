import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { TopBar } from '../../components/TopBar';
import { categoryGroups, categoryHref } from '../../lib/marketplace';

export default function CategoriesPage() {
  return <main id="main-content">
    <TopBar title="Danh mục" />
    <div className="page-container">
      {categoryGroups.map(category => <Link className="list-menu-item" href={categoryHref(category.key)} key={category.key}>
        <span>{category.label}</span><ChevronRight size={18} />
      </Link>)}
    </div>
  </main>;
}
