import { jest, beforeEach, afterEach, test, expect, describe } from "@jest/globals";

const githubMockModule = {
  context: {},
  getOctokit: jest.fn(),
};

const coreMockModule = {
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
};

await jest.unstable_mockModule("@actions/github", () => githubMockModule);
await jest.unstable_mockModule("@actions/core", () => coreMockModule);

const core = await import("@actions/core");
const github = await import("@actions/github");
const setInputs = (await import("./test-utils.js")).default;
const getNextVersion = (await import("../src/version.js")).default;

const buildCommitResponse = (messages) => {
  const commits = messages.map((message) => {
    return { commit: { message } };
  });
  return {
    data: commits,
  };
};

const mockGitHub = (messages) => {
  const commits = buildCommitResponse(messages);
  const listCommits = jest.fn().mockReturnValueOnce(commits);
  const listMatchingRefs = jest.fn().mockResolvedValueOnce({
    data: [
      { ref: "refs/tags/1.2.0" },
      { ref: "refs/tags/1.1.1" },
      { ref: "refs/tags/1.1.0" },
      { ref: "refs/tags/1.2.1-alpha.r.0" },
      { ref: "refs/tags/1.2.1-rc.0" },
    ],
  });

  return {
    rest: {
      pulls: {
        listCommits,
      },
      git: {
        listMatchingRefs,
      },
    },
  };
};

afterEach(() => {
  jest.resetAllMocks();
  Object.keys(githubMockModule.context).forEach((key) => {
    delete githubMockModule.context[key];
  });
});

describe("Test versioning", () => {
  beforeEach(() => {
    Object.assign(githubMockModule.context, {
      issue: {
        owner: "owner",
        repo: "repo",
        number: 1,
      },
      repo: {
        repo: "repo",
      },
    });

    setInputs({
      github_token: "token",
      prerelease_id: "rc",
    });
  });

  test("major version bump", async () => {
    const messages = ["fix!: repair something", "test: add unit tests"];
    const githubApiMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubApiMock);

    const nextVersion = await getNextVersion(false);

    expect(nextVersion).toBe("2.0.0");
    expect(githubApiMock.rest.pulls.listCommits).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
      per_page: 100,
    });
    expect(githubApiMock.rest.git.listMatchingRefs).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      ref: "tags/",
    });
  });

  test("minor version bump", async () => {
    const messages = ["feat: new feature", "test: test for feature"];
    const githubApiMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubApiMock);

    const nextVersion = await getNextVersion(false);

    expect(nextVersion).toBe("1.3.0");
  });

  test("patch version bump", async () => {
    const messages = ["fix: bug fix", "test: test for bugfix"];
    const githubApiMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubApiMock);

    const nextVersion = await getNextVersion(false);

    expect(nextVersion).toBe("1.2.1");
  });

  test("rc version", async () => {
    const messages = ["feat: new feature"];
    const githubApiMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubApiMock);

    const nextVersion = await getNextVersion(true);

    expect(nextVersion).toBe("1.3.0-rc.0");
  });

  test("rc version with existing rc version", async () => {
    const messages = ["fix: bug fix"];
    const githubApiMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubApiMock);

    const nextVersion = await getNextVersion(true);

    expect(nextVersion).toBe("1.2.1-rc.1");
  });

  test("prerelease identifier with a dot", async () => {
    setInputs({
      token: "token",
      prerelease_id: "alpha.r",
    });

    const messages = ["fix: bug fix"];
    const githubApiMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubApiMock);

    const nextVersion = await getNextVersion(true);

    expect(nextVersion).toBe("1.2.1-alpha.r.1");
  });

  test("prerelease identifier too long", async () => {
    setInputs({
      token: "token",
      prerelease_id: "overtenchar",
    });

    const messages = ["fix: bug fix"];
    const githubApiMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubApiMock);

    const nextVersion = await getNextVersion(true);

    expect(nextVersion).toBe(null);
    expect(core.setFailed).toHaveBeenCalledWith("prerelease_id is too long");
  });
});
