import { connection } from "next/server";
import { InstagramShowcase } from "@/components/instagram-showcase";
import { getInstagramFeed } from "@/lib/instagram/queries";
import type { InstagramFeed } from "@/lib/instagram/types";

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/arenasulsports/";

const fallbackFeed: InstagramFeed = {
  status: "unconfigured",
  stories: [],
  storiesFetchedAt: null,
  reels: [],
};

function InstagramSectionContent({ feed }: { feed: InstagramFeed }) {
  return (
    <section
      className="instagram section"
      id="instagram"
      aria-labelledby="instagram-title"
    >
      <span className="anchor-alias" id="eventos" aria-hidden="true" />
      <div className="instagram-heading shell">
        <div>
          <p className="section-kicker light">Agora no Instagram</p>
          <h2 id="instagram-title">Reels, Stories e bastidores da Arena.</h2>
        </div>
        <div className="instagram-heading-copy">
          <p>
            Conteúdo novo publicado pela Arena Sul aparece aqui para você
            acompanhar treinos, encontros e o dia a dia do espaço.
          </p>
          <a
            className="button button-instagram"
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Seguir @arenasulsports <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div className="shell">
        <InstagramShowcase feed={feed} />
      </div>
    </section>
  );
}

export function InstagramSectionFallback() {
  return <InstagramSectionContent feed={fallbackFeed} />;
}

export async function InstagramSection() {
  await connection();
  const feed = await getInstagramFeed();
  return <InstagramSectionContent feed={feed} />;
}
