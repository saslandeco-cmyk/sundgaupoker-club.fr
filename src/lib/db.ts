import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

declare global {
  var __pgSql: Sql | undefined;
  var __pgSchemaReady: Promise<void> | undefined;
}

/**
 * Next.js exécute chaque page une fois pendant `next build` — y compris
 * celles marquées `export const dynamic = "force-dynamic"` — pour vérifier
 * qu'elles ne lèvent pas d'erreur avant de les classer comme dynamiques.
 * À ce stade, il n'y a ni requête entrante ni forcément de base de données
 * disponible (`DATABASE_URL` peut ne pas encore être configuré, ou pointer
 * vers une base injoignable depuis l'environnement de build). Les fonctions
 * de lecture de `store.ts` appelées directement par les pages vérifient
 * cette variable et renvoient des valeurs par défaut sans jamais toucher la
 * base à ce moment-là — c'est la protection principale contre les échecs de
 * build. Au runtime réel (requêtes servies), cette variable n'est plus
 * définie et le client Postgres normal est utilisé normalement.
 */
export const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function createClient(): Sql {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL n'est pas défini. Renseignez la chaîne de connexion à votre " +
        "base Postgres dans .env.local (voir .env.example) — une base Vercel " +
        "Postgres, Neon ou Supabase (plan gratuit) convient parfaitement. Sur " +
        "Vercel, ajoutez cette variable dans Project Settings → Environment " +
        "Variables puis redéployez."
    );
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  return postgres(connectionString, {
    // La plupart des hébergeurs Postgres managés (Neon, Supabase, Vercel
    // Postgres…) exigent TLS ; une base locale n'en a généralement pas besoin.
    ssl: isLocal ? false : "require",
    // Limite basse adaptée au serverless : chaque instance de fonction garde
    // peu de connexions ouvertes, pour ne pas épuiser le pool de la base
    // quand plusieurs instances tournent en parallèle.
    max: 5,
  });
}

async function ensureSchema(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      date TIMESTAMPTZ NOT NULL,
      venue TEXT NOT NULL,
      start_time TEXT NOT NULL DEFAULT '',
      starting_stack TEXT NOT NULL DEFAULT '',
      round_duration TEXT NOT NULL DEFAULT '',
      break_info TEXT NOT NULL DEFAULT '',
      final_table TEXT NOT NULL DEFAULT '',
      max_seats INTEGER NOT NULL,
      online_registration BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS registrants (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      nickname TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS registrants_tournament_id_idx
      ON registrants (tournament_id)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS authorized_members (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

/**
 * Retourne le client Postgres, en garantissant que le schéma (les deux
 * tables) a bien été créé au préalable. La connexion et la vérification du
 * schéma ne sont faites qu'une seule fois par instance de serveur : mises en
 * cache sur `globalThis`, qui survit aux rechargements à chaud de Next.js en
 * développement et reste valable pour toute la durée de vie d'une instance
 * de fonction serverless en production.
 */
export async function getSql(): Promise<Sql> {
  if (!globalThis.__pgSql) {
    globalThis.__pgSql = createClient();
  }
  if (!globalThis.__pgSchemaReady) {
    globalThis.__pgSchemaReady = ensureSchema(globalThis.__pgSql);
  }
  await globalThis.__pgSchemaReady;
  return globalThis.__pgSql;
}
