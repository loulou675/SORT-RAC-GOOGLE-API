import { ArrowUpRight, Clock3, Gauge, Leaf } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { EcoTip } from '../data/ecoTips'
import { trackFeature } from '../services/siteAnalytics'

interface EcoTipCardProps {
  tip: EcoTip
  compact?: boolean
}

export function EcoTipCard({ tip, compact = false }: EcoTipCardProps) {
  const imageUrl = `${import.meta.env.BASE_URL}${tip.coverImage}`

  return (
    <Link
      to={`/eco-tips/${tip.code}`}
      className={`eco-tip-card${compact ? ' compact' : ''}`}
      style={{ '--tip-accent': tip.accent } as CSSProperties}
      onClick={() => void trackFeature(`eco_tip_${tip.code}`)}
    >
      <div className="eco-tip-card-media">
        <img src={imageUrl} alt={tip.imageAlt} loading="lazy" />
        <span className="eco-tip-category">
          <Leaf size={14} aria-hidden="true" />
          <span>{tip.category}</span>
        </span>
      </div>
      <div className="eco-tip-card-copy">
        <div>
          <p className="eco-tip-kicker">Give it another life</p>
          <h3>{tip.titleEn}</h3>
          <p>{tip.summaryEn}<span className="vi-note">{tip.summaryVi}</span></p>
        </div>
        <div className="eco-tip-card-footer">
          <span><Clock3 size={14} aria-hidden="true" /> {tip.estimatedMinutes} min</span>
          <span><Gauge size={14} aria-hidden="true" /> {tip.difficulty}</span>
          <i aria-hidden="true"><ArrowUpRight size={18} /></i>
        </div>
      </div>
    </Link>
  )
}
