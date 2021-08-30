const { getDirFilenames, getDaysApart, addTrailingSlash } = require("./utils");
const {
  readdir,
  stat,
  rmdir,
  mkdtemp,
  mkdir,
  writeFile,
} = require("fs").promises;

describe("on getDirFilenames", () => {
  let root;
  const folders = ["folder-1", "folder-1/folder-2"];
  const files = [
    "file-1.txt",
    "file-2.js",
    `${folders[0]}/file-3.html`,
    `${folders[1]}/file-4.png`,
  ];

  beforeEach(async () => {
    root = await mkdtemp("/tmp/nptc-");
    // Make folders
    for (let folder of folders) {
      await mkdir(`${root}/${folder}`);
    }
    // Make files
    await Promise.all(files.map((file) => writeFile(`${root}/${file}`, "")));
  });

  afterEach(async () => {
    await rmdir(root).catch(() => {});
  });

  it("returns all files in tree", async () => {
    const result = await getDirFilenames(root);
    expect(result).toEqual(files.map((file) => `${root}/${file}`));
  });
});

describe("on getDaysApart", () => {
  const day = 1000 * 60 * 60 * 24;

  it("returns number of days apart", () => {
    const today = new Date();
    const yesterday = new Date(today.valueOf() - day);
    expect(getDaysApart(today, yesterday)).toEqual(1);
  });

  it("returns absolute number of days apart", () => {
    const today = new Date();
    const yesterday = new Date(today.valueOf() - day * 10);
    expect(getDaysApart(today, yesterday)).toEqual(10);
  });
});

describe("on addTrailingSlash", () => {
  it("adds trailing slash", () => {
    const str = "/a/b/c/d";
    expect(addTrailingSlash(str)).toEqual(`${str}/`);
  });

  it("ignores strings with trailing slashes", () => {
    const str = "/a/b/c/d/";
    expect(addTrailingSlash(str)).toEqual(str);
  });
});
