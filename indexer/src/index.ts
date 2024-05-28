import Keeper from "./keeper";

/**
 * Indexer execution lifecycle
 */
async function execute(): Promise<void> {
  // Collect env vars
  const RPC_URL: string | undefined = process.env.RPC_URL;
  const REDIS_URL: string = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

  // Ensure env vars exist
  if (!RPC_URL) throw new Error("Missing env vars");

  // Create new keeper
  const keeper = new Keeper(RPC_URL, REDIS_URL);
  // Create new profile agent
  await Promise.all([
    // Run keeper sync
    keeper.sync(),
  ]);
}

(async () => {
  try {
    // Run execution lifecycle
    await execute();
  } catch (err: unknown) {
    console.error(err);
    process.exit(1);
  }
})();
