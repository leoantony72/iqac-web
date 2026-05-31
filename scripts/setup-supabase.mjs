import fs from "node:fs/promises";
import dns from "node:dns/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const envPath = path.join(projectRoot, ".env");
const schemaPath = path.join(projectRoot, "supabase", "schema.sql");

dotenv.config({ path: envPath });

const connectionString =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Missing SUPABASE_DATABASE_URL (or DATABASE_URL). Add your Supabase database connection string to .env and rerun npm run supabase:setup."
  );
  process.exit(1);
}

await fs.access(schemaPath);

const schemaSql = await fs.readFile(schemaPath, "utf8");
const { Client } = pg;
const databaseUrl = new URL(connectionString);

let ipv4Address = null;
try {
  ipv4Address = (await dns.resolve4(databaseUrl.hostname))[0] ?? null;
} catch {
  ipv4Address = null;
}

if (!ipv4Address) {
  const ipv6Addresses = await dns
    .resolve6(databaseUrl.hostname)
    .catch(() => []);

  if (ipv6Addresses.length > 0) {
    console.error(
      `Supabase database host ${databaseUrl.hostname} is reachable only over IPv6, but this WSL environment cannot connect to that address family.`
    );
    console.error(
      "Run the bootstrap from a network/machine with IPv6 access, or use the Supabase SQL editor to apply supabase/schema.sql."
    );
    process.exit(1);
  }

  console.error(
    `Could not resolve an IPv4 or IPv6 address for ${databaseUrl.hostname}. Check SUPABASE_DATABASE_URL in .env.`
  );
  process.exit(1);
}

const client = new Client({
  host: ipv4Address,
  port: databaseUrl.port ? Number(databaseUrl.port) : 5432,
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.replace(/^\//, "") || "postgres",
  ssl: {
    rejectUnauthorized: false,
    servername: databaseUrl.hostname,
  },
});

try {
  await client.connect();
  await client.query(schemaSql);
} catch (error) {
  console.error("Failed to provision Supabase schema.");
  console.error(error);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}

console.log("Supabase schema provisioned successfully.");
