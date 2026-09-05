import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { History, Info, Lightbulb, ScanLine, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { searchWasteItems } from '../features/search/searchEngine'
import { trackFeature, trackPageView } from '../services/siteAnalytics'

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const results = useMemo(() => searchWasteItems(query, 5), [query])

  useEffect(() => {
    const routeFeature = location.pathname === '/'
      ? 'waste_scan'
      : location.pathname.replace(/^\//, '').replace(/\//g, '_') || 'waste_scan'
    void trackPageView(routeFeature)
  }, [location.pathname])

  function chooseItem(itemCode: string) {
    void trackFeature('manual_search')
    setQuery('')
    setFocused(false)
    navigate(`/?item=${itemCode}&source=search`)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const first = results[0]
    if (first) {
      chooseItem(first.item.code)
    }
  }

  return (
    <div className="app-shell">
      <main className="main-surface">
        <header className="top-bar">
          <form className="search-form" role="search" onSubmit={submitSearch}>
            <button type="submit" className="search-submit" aria-label="Search">
              <Search size={16} aria-hidden="true" />
            </button>
            <div className="search-pill">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => window.setTimeout(() => setFocused(false), 120)}
                placeholder="Search waste item"
                aria-label="Search waste item"
              />
            </div>
            {focused && query ? (
              <div className="search-suggestions">
                {results.length ? (
                  results.map(({ item }) => (
                    <button type="button" key={item.code} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseItem(item.code)}>
                      <strong>{item.nameEn}</strong>
                      <span>{item.nameVi}</span>
                    </button>
                  ))
                ) : (
                  <p>No item found</p>
                )}
              </div>
            ) : null}
          </form>
          <button type="button" className="menu-button info-corner" aria-label="About" onClick={() => navigate('/about')}>
            <Info size={17} aria-hidden="true" />
          </button>
        </header>
        <Outlet />
      </main>

      {/* Keep navigation outside the result content surface so result sheets
          cannot unmount or cover it while they are open. */}
      <aside className="rail" aria-label="Primary">
        <button
          type="button"
          aria-label="Eco Tips"
          className={location.pathname.startsWith('/eco-tips') ? 'active' : ''}
          onClick={() => { void trackFeature('eco_tips'); navigate('/eco-tips') }}
        >
          <Lightbulb size={18} aria-hidden="true" />
          <span className="nav-label">Eco Tips</span>
        </button>
        <button type="button" aria-label="Waste Scan" className={location.pathname === '/' ? 'active' : ''} onClick={() => { void trackFeature('waste_scan'); navigate('/') }}>
          <ScanLine size={20} aria-hidden="true" />
          <span className="nav-label">Waste Scan</span>
        </button>
        <button type="button" aria-label="Scan history" className={location.pathname === '/history' ? 'active' : ''} onClick={() => { void trackFeature('history'); navigate('/history') }}>
          <History size={17} aria-hidden="true" />
          <span className="nav-label">History</span>
        </button>
      </aside>
    </div>
  )
}
