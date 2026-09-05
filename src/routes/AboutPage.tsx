import { Activity, ArrowUpRight, Cpu, Database, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <section className="flow-layout about-layout">
      <div className="page-heading about-heading">
        <div className="about-kicker">About SỌRT RÁC</div>
        <h1>
          <span>AI identifies the item.</span>
          <span className="about-heading-accent">Sorting guidance decides the bin.</span>
        </h1>
        <p>
          SỌRT RÁC turns one quick scan into a clear next step: identify the item, understand its material, and place it where it belongs.
        </p>
      </div>
      <div className="about-card-grid">
        <section className="about-card about-card-data">
          <div className="about-card-topline">
            <span className="about-card-index">01</span>
            <span className="about-card-icon"><Database size={17} aria-hidden="true" /></span>
          </div>
          <h2>Guidance changes</h2>
          <p>
            Disposal guidance depends on the selected station. Check local signage whenever collection rules change.
          </p>
        </section>
        <section className="about-card about-card-analytics">
          <div className="about-card-topline">
            <span className="about-card-index">02</span>
            <span className="about-card-icon"><Activity size={17} aria-hidden="true" /></span>
          </div>
          <h2>Private by design</h2>
          <p>
            We measure broad usage patterns with random browser and session identifiers. Names and scanned images are not included.
          </p>
        </section>
        <section className="about-card about-card-model">
          <div className="about-card-topline">
            <span className="about-card-index">03</span>
            <span className="about-card-icon"><Cpu size={17} aria-hidden="true" /></span>
          </div>
          <h2>Recognition in progress</h2>
          <p>
            The app combines a trained vision model with structured disposal guidance. More real-world examples help it improve.
          </p>
        </section>
      </div>
      <div className="about-footer">
        <div className="about-footer-note">
          <LinkIcon size={15} aria-hidden="true" />
          <span>One scan. One clearer choice.</span>
        </div>
        <Link className="primary-action large about-cta" to="/">
          <span>Start scanning</span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
