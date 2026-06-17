import { getDesign } from "@konde/kdf";

export function HeroSection() {
  const d = getDesign("homepage");

  return (
    <section data-kdf="hero.wrapper" className={d("hero.wrapper")}>
      <div data-kdf="hero.content" className={d("hero.content")}>
        <h1 data-kdf="hero.title" className={d("hero.title")}>
          Build websites with AI
        </h1>
        <p data-kdf="hero.description" className={d("hero.description")}>
          The AI orchestration platform for web development teams.
        </p>
        <div data-kdf="hero.actions" className={d("hero.actions")}>
          <a href="/about" data-kdf="hero.cta-secondary" className={d("hero.cta-secondary")}>
            Learn more
          </a>
          <a href="/pricing" data-kdf="hero.cta-primary" className={d("hero.cta-primary")}>
            Get started
          </a>
        </div>
      </div>
    </section>
  );
}

/*
  kdf/shared/button.json (plain CSS version):
    "base": "kdf-btn",
    "cta": "kdf-btn kdf-btn--primary kdf-btn--lg",
    "outline": "kdf-btn kdf-btn--outline"

  styles.css:
    .kdf-btn { display: inline-flex; padding: 0.5rem 1rem; border-radius: 4px; }
    .kdf-btn--primary { background: #4F46E5; color: white; }
    .kdf-btn--lg { padding: 0.75rem 1.5rem; font-size: 1.125rem; }

  Same d() API, same data-kdf, same JSON — different CSS underneath.
*/
