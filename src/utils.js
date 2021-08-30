const { join } = require("path");
const { readdir, stat } = require("fs").promises;

/** Returns an array of file paths within the given directory */
const getDirFilenames = async (dir) =>
  readdir(dir)
    .then((files) =>
      Promise.all(
        files.map(async (file) => {
          const filePath = join(dir, file);
          const isDirectory = (await stat(filePath)).isDirectory();
          if (isDirectory) {
            return getDirFilenames(filePath);
          }

          return filePath;
        })
      )
    )
    .then((results) => results.flat());

/** Returns number of days between two dates */
const getDaysApart = (d1, d2) =>
  Math.ceil(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));

/** Add trailing slash to string */
const addTrailingSlash = (str) => str.replace(/\/?$/, "/");

module.exports = {
  getDirFilenames,
  getDaysApart,
  addTrailingSlash,
};
