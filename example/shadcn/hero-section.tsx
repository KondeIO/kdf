import { getDesign } from "@konde/kdf";
import { Button } from "@/components/ui/button";

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
          <Button asChild data-kdf="hero.cta-secondary" className={d("hero.cta-secondary")}>
            <a href="/about">Learn more</a>
          </Button>
          <Button asChild data-kdf="hero.cta-primary" className={d("hero.cta-primary")}>
            <a href="/pricing">Get started</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/*
  kdf/homepage.json:
    "hero.cta-primary": { "$": "Button", "variant": "default", "className": "@button.cta" }

  shadcn Button gets KDF className on top of its own variant styles.
*/
