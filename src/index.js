const { stat, unlink, rmdir } = require("fs").promises;
const { getDaysApart, getDirFilenames, addTrailingSlash } = require("./utils");

const TMP_CACHE_DIR = ".netlify-plugin-ttl-cache";

/** Get old cache and prepare files. */
const onPreBuild = async ({ utils, inputs }) => {
  // Restore build cache
  const hasCache = await utils.cache.restore(inputs.path);

  if (!hasCache) {
    return;
  }

  // Remove files that have passed ttl threshold or match exclude regex
  const files = await getDirFilenames(inputs.path);
  const today = new Date();
  const exclude = new RegExp(inputs.exclude);
  await Promise.all(
    files.map(async (file) => {
      const { mtime } = await stat(file);
      if (exclude.test(file) || getDaysApart(mtime, today) > inputs.ttl) {
        await unlink(file);
      }
    })
  );

  // Move to temporary directory to be restored post-build
  await utils.run("cp", ["-r", inputs.path, TMP_CACHE_DIR]);
};

/** Restore cached files along with latest build assets (without replacement). */
const onPostBuild = async ({ utils, inputs }) => {
  if (await stat(TMP_CACHE_DIR).catch(() => false)) {
    await utils.run("rsync", [
      "-r",
      "--ignore-existing",
      addTrailingSlash(TMP_CACHE_DIR),
      addTrailingSlash(inputs.path),
    ]);
    await rmdir(TMP_CACHE_DIR, { recursive: true });
  }

  // Save new cache
  await utils.cache.save(inputs.path);
};

module.exports = {
  onPreBuild,
  onPostBuild,
};
