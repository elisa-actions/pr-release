import { jest, beforeEach, test, expect } from "@jest/globals";

const githubMockModule = {
  context: {},
  getOctokit: jest.fn(),
};

const coreMockModule = {
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
};

const releaseNotesMockModule = {
  default: jest.fn(),
};

await jest.unstable_mockModule("@actions/github", () => githubMockModule);
await jest.unstable_mockModule("@actions/core", () => coreMockModule);
await jest.unstable_mockModule("../src/release-notes.js", () => releaseNotesMockModule);

const github = await import("@actions/github");
const setInputs = (await import("./test-utils.js")).default;
const createReleaseNotes = (await import("../src/release-notes.js")).default;
const createReleaseData = (await import("../src/release-data.js")).default;

beforeEach(() => {
  const issue = {
    data: {
      title: "Issue title",
      body: "Issue body",
    },
  };

  const githubApiMock = {
    rest: {
      issues: {
        get: jest.fn().mockResolvedValueOnce(issue),
      },
    },
  };

  Object.assign(githubMockModule.context, {
    issue: {
      owner: "owner",
      repo: "repo",
      number: 1,
    },
  });

  github.getOctokit.mockImplementation((token) => githubApiMock);
  createReleaseNotes.mockResolvedValueOnce("release note data");
});

test("create release data", async () => {
  setInputs({
    github_token: "token",
    release_notes: "true",
  });

  const releaseData = await createReleaseData();

  expect(releaseData).toEqual({
    title: "Issue title",
    body: "Issue body\n\nrelease note data",
  });
});

test("create release data default release notes", async () => {
  setInputs({
    github_token: "token",
    release_notes: "",
  });

  // createReleaseNotes was already stubbed once in beforeEach; stub again for this test
  createReleaseNotes.mockResolvedValueOnce("release note data");

  const releaseData = await createReleaseData();

  expect(releaseData).toEqual({
    title: "Issue title",
    body: "Issue body\n\nrelease note data",
  });
});

test("create release data without release notes", async () => {
  setInputs({
    github_token: "token",
    release_notes: "false",
  });

  const releaseData = await createReleaseData();

  expect(releaseData).toEqual({
    title: "Issue title",
    body: "Issue body",
  });
});

test("Dependabot instructions are removed from release notes", async () => {
  setInputs({
    github_token: "token",
    release_notes: "true",
  });

  const issue = {
    data: {
      title: "Issue title",
      body: "Dependabot body\n\nDependabot will resolve any conflicts with this PR as long as you don't alter it yourself. You can also trigger a rebase manually by commenting `@dependabot rebase`.",
    },
  };

  const githubApiMock = {
    rest: {
      issues: {
        get: jest.fn().mockResolvedValueOnce(issue),
      },
    },
  };

  github.getOctokit.mockImplementation((token) => githubApiMock);
  createReleaseNotes.mockResolvedValueOnce("release note data");

  const releaseData = await createReleaseData();

  expect(releaseData).toEqual({
    title: "Issue title",
    body: "Dependabot body\n\nrelease note data",
  });
});
