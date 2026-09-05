import { ArrowLeft, Check, Clock3, ExternalLink, Gauge, Leaf, ShieldCheck } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EcoTipCard } from '../components/EcoTipCard'
import { EmptyState } from '../components/EmptyState'
import { ecoTips, getEcoTip } from '../data/ecoTips'

export function ReusePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const tip = getEcoTip(id)

  if (!tip) {
    return (
      <EmptyState title="Eco Tip not found">
        Return to the library and choose another project. / Hãy quay lại thư viện và chọn một dự án khác.
      </EmptyState>
    )
  }

  const relatedTips = ecoTips
    .filter((entry) => entry.code !== tip.code && (entry.category === tip.category || entry.materialCode === tip.materialCode))
    .slice(0, 2)

  return (
    <article className="eco-tip-detail" style={{ '--tip-accent': tip.accent } as CSSProperties}>
      <header className="eco-tip-detail-hero">
        <img src={`${import.meta.env.BASE_URL}${tip.coverImage}`} alt={tip.imageAlt} />
        <button type="button" className="eco-tip-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Back</span>
        </button>
        <span className="eco-tip-detail-category"><Leaf size={15} aria-hidden="true" /> {tip.category}</span>
      </header>

      <div className="eco-tip-detail-content">
        <div className="eco-tip-detail-intro">
          <p className="eyebrow">Eco Tip</p>
          <h1>{tip.titleEn}</h1>
          <p>{tip.summaryEn}<span className="vi-note">{tip.summaryVi}</span></p>
          <div className="eco-tip-detail-meta">
            <span><Clock3 size={17} aria-hidden="true" /><small>Time</small><strong>{tip.estimatedMinutes} min</strong></span>
            <span><Gauge size={17} aria-hidden="true" /><small>Difficulty</small><strong>{tip.difficulty}</strong></span>
            <span><Leaf size={17} aria-hidden="true" /><small>Type</small><strong>{tip.category}</strong></span>
          </div>
        </div>

        <section className="eco-tip-impact">
          <span><Leaf size={20} aria-hidden="true" /></span>
          <div>
            <h2>Why try it?</h2>
            <p>{tip.impactEn}<span className="vi-note">{tip.impactVi}</span></p>
          </div>
        </section>

        <section className="eco-tip-materials">
          <div className="eco-tip-section-heading">
            <p className="eyebrow">Get ready</p>
            <h2>What you need</h2>
          </div>
          <ul>
            {tip.materialsEn.map((material, index) => (
              <li key={material}><Check size={16} aria-hidden="true" /> <span>{material}<span className="vi-note">{tip.materialsVi[index]}</span></span></li>
            ))}
          </ul>
        </section>

        <section className="eco-tip-steps">
          <div className="eco-tip-section-heading">
            <p className="eyebrow">Make it</p>
            <h2>Step by step</h2>
          </div>
          <ol>
            {tip.stepsEn.slice(0, 5).map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>{step}<span className="vi-note">{tip.stepsVi[index]}</span></p>
              </li>
            ))}
          </ol>
        </section>

        <section className="eco-tip-safety">
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <h2>Keep it safe</h2>
            <p>{tip.safetyNoteEn}<span className="vi-note">{tip.safetyNoteVi}</span></p>
          </div>
        </section>

        <a className="eco-tip-source" href={tip.sourceUrl} target="_blank" rel="noreferrer">
          <span><small>Guidance basis</small><strong>{tip.sourceLabel}</strong></span>
          <ExternalLink size={18} aria-hidden="true" />
        </a>

        {relatedTips.length ? (
          <section className="eco-tip-related">
            <div className="eco-tip-section-heading">
              <p className="eyebrow">Keep exploring</p>
              <h2>More second lives</h2>
            </div>
            <div className="eco-tip-grid compact-grid">
              {relatedTips.map((entry) => <EcoTipCard key={entry.code} tip={entry} />)}
            </div>
          </section>
        ) : null}

        <button type="button" className="eco-tip-library-link" onClick={() => navigate('/eco-tips')}>
          <span>Explore all Eco Tips</span>
        </button>
      </div>
    </article>
  )
}
