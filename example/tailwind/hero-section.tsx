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
  kdf/shared/button.json:
    "cta": "bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl"

  kdf/homepage.json:
    "hero.cta-primary": "@button.base @button.cta @button.md"
*/
