import { jest, beforeEach, afterEach, test, expect } from "@jest/globals";

const githubMockModule = {
  context: {},
  getOctokit: jest.fn(),
};

const coreMockModule = {
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
};

const commentMockModule = {
  addComment: jest.fn(),
  addCommentReaction: jest.fn(),
};

const createReleaseMockModule = {
  default: jest.fn(),
};

const prMockModule = {
  default: jest.fn(),
};

const releaseDataMockModule = {
  default: jest.fn(),
};

const updateTagMockModule = {
  default: jest.fn(),
};

const versionMockModule = {
  default: jest.fn(),
};

await jest.unstable_mockModule("@actions/github", () => githubMockModule);
await jest.unstable_mockModule("@actions/core", () => coreMockModule);
await jest.unstable_mockModule("../src/comment.js", () => commentMockModule);
await jest.unstable_mockModule("../src/create-release.js", () => createReleaseMockModule);
await jest.unstable_mockModule("../src/pr.js", () => prMockModule);
await jest.unstable_mockModule("../src/release-data.js", () => releaseDataMockModule);
await jest.unstable_mockModule("../src/update-tag.js", () => updateTagMockModule);
await jest.unstable_mockModule("../src/version.js", () => versionMockModule);

const github = await import("@actions/github");
const setInputs = (await import("./test-utils.js")).default;

const { addComment, addCommentReaction } = await import("../src/comment.js");
const createRelease = (await import("../src/create-release.js")).default;
const getPR = (await import("../src/pr.js")).default;
const createReleaseData = (await import("../src/release-data.js")).default;
const getNextVersion = (await import("../src/version.js")).default;
const updateMajorTag = (await import("../src/update-tag.js")).default;
const { run } = await import("../src/pr-release.js");

beforeEach(() => {
  createReleaseData.mockResolvedValueOnce({
    title: "Release title",
    body: "Release body",
  });
});

afterEach(() => {
  jest.clearAllMocks();
  Object.keys(githubMockModule.context).forEach((key) => {
    delete githubMockModule.context[key];
  });
});

test("PR was closed", async () => {
  Object.assign(githubMockModule.context, {
    payload: {
      action: "closed",
    },
  });

  getPR.mockResolvedValueOnce({
    data: { head: { sha: "sha" }, merged: false, number: 1 },
  });

  await run();

  expect(getNextVersion).not.toHaveBeenCalled();
});

test("New release not required", async () => {
  Object.assign(githubMockModule.context, {
    payload: {
      action: "closed",
    },
  });

  getPR.mockResolvedValueOnce({
    data: { head: { sha: "sha" }, merged: true },
  });

  getNextVersion.mockResolvedValueOnce(null);

  await run();

  expect(addComment).toHaveBeenCalledWith("New release not required :sparkles:");
  expect(createReleaseData).not.toHaveBeenCalled();
});

test("Create release", async () => {
  Object.assign(githubMockModule.context, {
    payload: {
      action: "closed",
    },
  });

  getPR.mockResolvedValueOnce({
    data: { head: { sha: "sha" }, merged: true },
  });

  getNextVersion.mockResolvedValueOnce("1.2.0");

  createRelease.mockResolvedValueOnce({
    html_url: "URL",
    draft: false,
  });

  setInputs({ dry_run: "false" });

  await run();

  expect(createRelease).toHaveBeenCalledWith(
    "1.2.0",
    "sha",
    "Release title",
    "Release body",
    false
  );
  expect(updateMajorTag).toHaveBeenCalledWith("1.2.0", "sha");
  expect(addComment).toHaveBeenCalledWith("Version [1.2.0](URL) released! :zap:");
});

test("Dry run labeled event", async () => {
  Object.assign(githubMockModule.context, {
    payload: {
      action: "labeled",
    },
  });

  setInputs({ dry_run: "true" });
  getNextVersion.mockResolvedValueOnce();

  await run();

  expect(getNextVersion).toHaveBeenCalledWith(false);
});

test("Create prerelease", async () => {
  Object.assign(githubMockModule.context, {
    payload: {
      action: "created",
      comment: { body: "/prerelease ", id: "comment_id" },
    },
  });

  getPR.mockResolvedValueOnce({
    data: { head: { sha: "sha" } },
  });

  getNextVersion.mockResolvedValueOnce("1.2.0-rc.0");

  createRelease.mockResolvedValueOnce({
    html_url: "URL",
    draft: false,
  });

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
  Object.assign(githubMockModule.context, {
    payload: {
      action: "created",
      comment: { body: "Some comment", id: "comment_id" },
    },
  });

  await run();

  expect(getPR).not.toHaveBeenCalled();
});
