jest.mock("fs", () => ({
  promises: {
    stat: jest.fn(),
    unlink: jest.fn(),
  },
}));
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  getDirFilenames: jest.fn(),
}));
const { stat, unlink } = require("fs").promises;
const { onPreBuild, onPostBuild } = require("./index");
const { getDirFilenames } = require("./utils");

const inputs = {
  ttl: 10,
  path: "some-path",
  exclude: "a^",
};
const utils = {
  cache: {
    restore: jest.fn(),
    save: jest.fn(),
  },
  run: jest.fn(),
};

beforeEach(jest.clearAllMocks);

describe("on onPreBuild", () => {
  const files = ["file-1.js", "file-2.png", "folder/file-1.png"];
  beforeEach(() => {
    utils.cache.restore.mockReturnValue(true);
    getDirFilenames.mockImplementation(() => Promise.resolve(files));
    stat.mockImplementation(() => Promise.resolve({ mtime: new Date() }));
  });

  it("attempts to load cache", async () => {
    await onPreBuild({ inputs, utils });
    expect(utils.cache.restore).toBeCalledTimes(1);
    expect(utils.cache.restore).toBeCalledWith(inputs.path);
  });

  describe("on cache miss", () => {
    beforeEach(() => {
      utils.cache.restore.mockImplementation(() => Promise.resolve(false));
    });

    it("returns early", async () => {
      await onPreBuild({ inputs, utils });
      expect(getDirFilenames).toBeCalledTimes(0);
    });
  });

  describe("on cache hit", () => {
    it("checks all files", async () => {
      await onPreBuild({ inputs, utils });
      expect(stat).toBeCalledTimes(files.length);
      expect(unlink).toBeCalledTimes(0);
    });

    it("copies files to temporary directory", async () => {
      await onPreBuild({ inputs, utils });
      expect(utils.run).toBeCalledTimes(1);
      expect(utils.run).toBeCalledWith("cp", [
        "-r",
        inputs.path,
        expect.any(String),
      ]);
    });
  });

  describe("on cache hit + expired files", () => {
    const invalidFiles = [files[0]];

    beforeEach(() => {
      stat.mockImplementation((arg) =>
        Promise.resolve({
          mtime: invalidFiles.includes(arg) ? new Date(0) : new Date(),
        })
      );
    });

    it("removes expired files before moving to cache dir", async () => {
      await onPreBuild({ inputs, utils });
      expect(unlink).toBeCalledTimes(invalidFiles.length);
      invalidFiles.forEach((f) => expect(unlink).toBeCalledWith(f));
    });
  });

  describe("on cache hit + excluded files", () => {
    const invalidFiles = [files[1], files[2]];

    beforeEach(() => {
      stat.mockImplementation((arg) =>
        Promise.resolve({
          mtime: invalidFiles.includes(arg) ? new Date(0) : new Date(),
        })
      );
    });

    it("removes excluded files before moving to cache dir", async () => {
      await onPreBuild({ inputs: { ...inputs, exclude: ".*.png$" }, utils });
      expect(unlink).toBeCalledTimes(invalidFiles.length);
      invalidFiles.forEach((f) => expect(unlink).toBeCalledWith(f));
    });
  });
});

describe("on onPostBuild", () => {
  describe("on no cache directory", () => {
    beforeEach(() => {
      stat.mockImplementation(() =>
        Promise.reject("no such file or directory")
      );
    });

    it("caches new output", async () => {
      await onPostBuild({ inputs, utils });
      expect(utils.run).toBeCalledTimes(0);
      expect(utils.cache.save).toBeCalledTimes(1);
      expect(utils.cache.save).toBeCalledWith(inputs.path);
    });
  });

  describe("on cache directory", () => {
    beforeEach(() => {
      stat.mockImplementation(() => Promise.resolve({}));
    });

    it("files are synced with build dir", async () => {
      await onPostBuild({ inputs, utils });
      expect(utils.run).toBeCalledTimes(1);
      expect(utils.run).toBeCalledWith("rsync", [
        "-r",
        "--ignore-existing",
        expect.any(String),
        `${inputs.path}/`,
      ]);
    });

    it("cache is updated", async () => {
      await onPostBuild({ inputs, utils });
      expect(utils.cache.save).toBeCalledTimes(1);
      expect(utils.cache.save).toBeCalledWith(inputs.path);
    });
  });
});
