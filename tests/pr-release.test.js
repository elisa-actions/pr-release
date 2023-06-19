jest.mock("@actions/github");
const github = require("@actions/github");
const setInputs = require("./test-utils");

jest.mock("../src/comment");
jest.mock("../src/create-release");
jest.mock("../src/pr");
jest.mock("../src/release-data");
jest.mock("../src/update-tag");
jest.mock("../src/version");

const { addComment, addCommentReaction } = require("../src/comment");
const createRelease = require("../src/create-release");
const getPR = require("../src/pr");
const createReleaseData = require("../src/release-data");
const getNextVersion = require("../src/version");
const updateMajorTag = require("../src/update-tag")
const { run } = require("../src/pr-release");

beforeEach(() => {
  createReleaseData.mockReturnValueOnce(
    Promise.resolve({ title: "Release title", body: "Release body" })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

test("PR was closed", async () => {
  jest.replaceProperty(github, "context", {
    payload: {
      action: "closed",
    },
  });
  getPR.mockReturnValueOnce(
    Promise.resolve({
      data: { head: { sha: "sha" }, merged: false, number: 1 },
    })
  );
  await run();
  expect(getNextVersion).not.toHaveBeenCalled();
});

test("New release not required", async () => {
  jest.replaceProperty(github, "context", {
    payload: {
      action: "closed",
    },
  });
  getPR.mockReturnValueOnce(
    Promise.resolve({
      data: { head: { sha: "sha" }, merged: true },
    })
  );
  getNextVersion.mockReturnValueOnce(Promise.resolve(null));
  await run();
  expect(addComment).toHaveBeenCalledWith(
    "New release not required :sparkles:"
  );
  expect(createReleaseData).not.toHaveBeenCalled();
});

test("Create release", async () => {
  jest.replaceProperty(github, "context", {
    payload: {
      action: "closed",
    },
  });
  getPR.mockReturnValueOnce(
    Promise.resolve({
      data: { head: { sha: "sha" }, merged: true },
    })
  );
  getNextVersion.mockReturnValueOnce(Promise.resolve("1.2.0"));
  createRelease.mockReturnValueOnce(
    Promise.resolve({
      html_url: "URL",
      draft: false,
    })
  );
  setInputs({ dry_run: "false" });

  await run();

  expect(createRelease).toHaveBeenCalledWith(
    "1.2.0",
    "sha",
    "Release title",
    "Release body",
    false
  );
  expect(updateMajorTag).toHaveBeenCalledWith("1.2.0", "sha")
  expect(addComment).toHaveBeenCalledWith(
    "Version [1.2.0](URL) released! :zap:"
  );
});

test("Dry run labeled event", async () => {
  jest.replaceProperty(github, "context", {
    payload: {
      action: "labeled",
    },
  });
  setInputs({ dry_run: "true" });
  getNextVersion.mockReturnValueOnce(
    Promise.resolve()
  );

  await run();

  expect(getNextVersion).toHaveBeenCalledWith(false);
})

test("Create prerelease", async () => {
  jest.replaceProperty(github, "context", {
    payload: {
      action: "created",
      comment: { body: "/prerelease ", id: "comment_id" },
    },
  });
  getPR.mockReturnValueOnce(
    Promise.resolve({
      data: { head: { sha: "sha" } },
    })
  );
  getNextVersion.mockReturnValueOnce(Promise.resolve("1.2.0-rc.0"));
  createRelease.mockReturnValueOnce(
    Promise.resolve({
      html_url: "URL",
      draft: false,
    })
  );
  setInputs({ dry_run: "false" });

  await run();

  expect(createRelease).toHaveBeenCalledWith(
    "1.2.0-rc.0",
    "sha",
    "Release title",
    "Release body",
    true
  );
  expect(addComment).toHaveBeenCalledWith(
    "Version [1.2.0-rc.0](URL) released! :zap:"
  );
  expect(addCommentReaction).toHaveBeenCalledWith("comment_id", "rocket");
});

test("Other comment should not trigger build", async () => {
  jest.replaceProperty(github, "context", {
    payload: {
      action: "created",
      comment: { body: "Some comment", id: "comment_id" },
    },
  });
  await run();
  expect(getPR).not.toHaveBeenCalled();
});
