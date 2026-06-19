import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";
import Logo from "@/components/Logo";

export default function Home() {
  const year = new Date().getFullYear();
  return (
    <>
      <div className="bg-blobs" aria-hidden="true">
        <span className="blob blob--1" />
        <span className="blob blob--2" />
        <span className="blob blob--3" />
      </div>

      <header className="nav">
        <Link className="brand" href="/">
          <Logo />
        </Link>
        <nav className="nav__links">
          <Link className="nav__link" href="/app">Try the demo</Link>
          <a className="nav__cta" href="#waitlist">Join the waitlist</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <span className="pill">⚡ Now onboarding early teams</span>
          <h1>
            Work that<br />
            <span className="grad-text">runs itself.</span>
          </h1>
          <p className="hero__sub">
            Hey Sello connects the tools you already use and lets AI run the repetitive work for you —
            the follow-ups, the data entry, the copy-paste between apps. You set the goal, we handle the grind.
          </p>

          <div className="prompt-demo" role="img" aria-label="Example command: Hey Sello, connect Gmail, Slack, Notion and your CRM and run anything in plain English">
            <span className="prompt-demo__dot" aria-hidden="true" />
            <p className="prompt-demo__text">
              <span className="prompt-demo__say">Hey Sello,</span>
              connect <span className="chip">📧 Gmail</span> <span className="chip">💬 Slack</span> <span className="chip">📝 Notion</span> <span className="chip">📇 CRM</span>
              and run anything in plain English<span className="prompt-demo__caret" aria-hidden="true" />
            </p>
          </div>

          <WaitlistForm />

          <div className="social-proof">
            <div className="avatars" aria-hidden="true">
              <span className="avatar">🦊</span>
              <span className="avatar">🐙</span>
              <span className="avatar">🦁</span>
              <span className="avatar">🐳</span>
            </div>
            <span className="social-proof__text">
              Join <strong>500+</strong> founders &amp; operators already on the list
            </span>
          </div>

          <p style={{ marginTop: 22 }}>
            <Link className="nav__link" href="/app" style={{ color: "var(--violet)", fontWeight: 700 }}>
              ▶ Try a live task →
            </Link>
          </p>
        </section>

        <section className="features" id="how">
          <h2 className="section-title">Automation that actually gets it done</h2>
          <p className="section-sub">No flowchart spaghetti. Describe the outcome you want and Hey Sello figures out the steps.</p>
          <div className="cards">
            <article className="card">
              <div className="card__icon">🔌</div>
              <h3>Connects everything</h3>
              <p>Gmail, Slack, Notion, your CRM, spreadsheets — Hey Sello plugs into the tools your team already lives in.</p>
            </article>
            <article className="card">
              <div className="card__icon">🧠</div>
              <h3>Thinks in plain English</h3>
              <p>&quot;Hey Sello — reply to new leads within 5 minutes and log them in the CRM.&quot; Say it like that. It builds it like that.</p>
            </article>
            <article className="card">
              <div className="card__icon">🔁</div>
              <h3>Runs on its own</h3>
              <p>Set it once and it works around the clock — handling the repetitive stuff so your team does the real work.</p>
            </article>
          </div>
        </section>

        <section className="steps">
          <h2 className="section-title">Up and running in minutes</h2>
          <div className="steps__grid">
            <div className="step">
              <span className="step__num">1</span>
              <h3>Connect your tools</h3>
              <p>Securely link the apps you want Hey Sello to work across.</p>
            </div>
            <div className="step">
              <span className="step__num">2</span>
              <h3>Describe the job</h3>
              <p>Tell Hey Sello what you want done, in your own words.</p>
            </div>
            <div className="step">
              <span className="step__num">3</span>
              <h3>Let it run</h3>
              <p>Approve it once, then watch the busywork disappear.</p>
            </div>
          </div>
        </section>

        <section className="faq" id="faq">
          <h2 className="section-title">Questions, answered</h2>
          <div className="faq__list">
            <details className="faq__item">
              <summary>Do I need to know how to code?</summary>
              <p>Nope. If you can describe what you want in a sentence, you can run a Hey Sello automation. No flowcharts, no scripts.</p>
            </details>
            <details className="faq__item">
              <summary>Which tools does Hey Sello connect to?</summary>
              <p>The ones you already use — Gmail, Slack, Notion, spreadsheets, and popular CRMs at launch, with more added every week. Tell us what you need and we&apos;ll prioritize it.</p>
            </details>
            <details className="faq__item">
              <summary>Is my data safe?</summary>
              <p>Yes. Connections use secure, revocable access, we only touch the data an automation needs, and we never sell it. You stay in control and can disconnect any tool at any time.</p>
            </details>
            <details className="faq__item">
              <summary>What does it cost?</summary>
              <p>Pricing is still being finalized, but waitlist members lock in founder pricing — a meaningful discount that stays with you.</p>
            </details>
            <details className="faq__item">
              <summary>When do I get access?</summary>
              <p>We&apos;re onboarding teams in small batches so everyone gets hands-on help. Join the list and we&apos;ll email you the moment your spot opens up.</p>
            </details>
          </div>
        </section>

        <section className="cta-band" id="waitlist">
          <h2>Be first in line.</h2>
          <p>Early members get founder pricing, priority onboarding, and a direct line to the team building Hey Sello.</p>
          <WaitlistForm dark cta="Join the waitlist" note="We'll only email you about early access." />
        </section>
      </main>

      <footer className="footer">
        <Logo size={20} />
        <span className="footer__copy">
          © {year} Hey Sello. Built for people with better things to do.
          <br className="footer__br" />
          We only use your email to send launch updates — never shared, unsubscribe anytime.
        </span>
      </footer>
    </>
  );
}
