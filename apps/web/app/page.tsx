import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="hero-card">
        <span className="eyebrow">Dhaka rush-hour engineering</span>
        <h1>Share a seat.<br />Split the fare.<br />Survive the traffic.</h1>
        <p>
          Nusrat, Rafiq, and Shirin need rides. Jashim has Bullet, a three-seat Tesla in the
          most Dhaka sense of the word. The app keeps the seats, fares, and ride lifecycle sane.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/login">Open demo</Link>
          <a className="button button-secondary" href="https://github.com/SajjadHossainSoykot/Dhaka-Tesla-Pool" target="_blank" rel="noreferrer">
            Repository
          </a>
        </div>
        <div className="hero-stats">
          <div><strong>3</strong><span>Bullet seats</span></div>
          <div><strong>20%</strong><span>pool discount</span></div>
          <div><strong>1 DB</strong><span>source of truth</span></div>
        </div>
      </section>
    </main>
  );
}
