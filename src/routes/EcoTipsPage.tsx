import { BookOpen, Boxes, Gift, Leaf, Search, Sprout } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EcoTipCard } from '../components/EcoTipCard'
import { ecoTips } from '../data/ecoTips'
import type { EcoTipCategory } from '../data/ecoTips'

const filters: Array<{ label: 'All' | EcoTipCategory; icon: typeof Leaf }> = [
  { label: 'All', icon: BookOpen },
  { label: 'Grow', icon: Sprout },
  { label: 'Organize', icon: Boxes },
  { label: 'Gift', icon: Gift },
  { label: 'Compost', icon: Leaf },
]

export function EcoTipsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'All' | EcoTipCategory>('All')
  const filteredTips = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return ecoTips.filter((tip) => {
      const matchesCategory = category === 'All' || tip.category === category
      const matchesQuery = !normalized || [tip.titleEn, tip.titleVi, tip.summaryEn, tip.summaryVi, tip.category, ...tip.materialsEn, ...tip.materialsVi]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalized)
      return tip.isActive && matchesCategory && matchesQuery
    })
  }, [category, query])

  return (
    <section className="eco-tips-page">
      <header className="eco-tips-hero">
        <div>
          <p className="eyebrow">Creative reuse library</p>
          <h1>
            <span>Small waste.</span>
            <em>Second life.</em>
          </h1>
          <p>Practical projects for clean everyday items, with short steps and clear safety notes.<span className="vi-note">Những ý tưởng thực tế cho đồ dùng sạch hằng ngày, với các bước ngắn gọn và lưu ý an toàn rõ ràng.</span></p>
        </div>
        <div className="eco-tips-count" aria-label={`${ecoTips.length} guides available`}>
          <strong>{ecoTips.length}</strong>
          <span>illustrated guides</span>
        </div>
      </header>

      <div className="eco-tips-tools">
        <label className="eco-tip-search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects or materials / Tìm dự án hoặc vật liệu"
            aria-label="Search Eco Tips"
          />
        </label>
        <div className="eco-tip-filters" role="tablist" aria-label="Filter Eco Tips">
          {filters.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={category === label}
              className={category === label ? 'active' : ''}
              onClick={() => setCategory(label)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {filteredTips.length ? (
        <div className="eco-tip-grid">
          {filteredTips.map((tip) => <EcoTipCard key={tip.code} tip={tip} />)}
        </div>
      ) : (
        <div className="eco-tip-empty">
          <Leaf size={26} aria-hidden="true" />
          <h2>No matching project yet</h2>
          <p>Try another material or clear the search.<span className="vi-note">Hãy thử vật liệu khác hoặc xóa nội dung tìm kiếm.</span></p>
          <button type="button" onClick={() => { setQuery(''); setCategory('All') }}>Show all guides</button>
        </div>
      )}
    </section>
  )
}
