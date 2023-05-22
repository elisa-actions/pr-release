jest.mock("@actions/github");
jest.mock("@actions/core");

const core = require("@actions/core");
const github = require("@actions/github");
const setInputs = require("./test-utils");
const getNextVersion = require("../src/version");

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
  const listMatchingRefs = jest
    .fn()
    .mockReturnValueOnce(
      Promise.resolve({
        data: [
          { ref: "refs/tags/1.2.0" },
          { ref: "refs/tags/1.1.1" },
          { ref: "refs/tags/1.1.0" },
          { ref: "refs/tags/1.2.1-alpha.r.0" },
          { ref: "refs/tags/1.2.1-rc.0" },
        ],
      })
    );
  return {
    rest: {
      pulls: {
        listCommits: listCommits,
      },
      git: {
        listMatchingRefs: listMatchingRefs,
      },
    },
  };
};

describe("Test versioning", () => {
  beforeEach(() => {
    jest.replaceProperty(github, "context", {
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
    const githubMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubMock);
    const nextVersion = await getNextVersion(false);
    expect(nextVersion).toBe("2.0.0");
    expect(githubMock.rest.pulls.listCommits).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
      per_page: 100,
    })
    expect(githubMock.rest.git.listMatchingRefs).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      ref: "tags/",
    })
  });

  test("minor version bump", async () => {
    const messages = ["feat: new feature", "test: test for feature"];
    const githubMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubMock);
    const nextVersion = await getNextVersion(false);
    expect(nextVersion).toBe("1.3.0");
  })

  test("patch version bump", async () => {
    const messages = ["fix: bug fix", "test: test for bugfix"];
    const githubMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubMock);
    const nextVersion = await getNextVersion(false);
    expect(nextVersion).toBe("1.2.1");
  })

  test("rc version", async () => {
    const messages = ["feat: new feature"];
    const githubMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubMock);
    const nextVersion = await getNextVersion(true);
    expect(nextVersion).toBe("1.3.0-rc.0");
  })

  test("rc version with existing rc version", async () => {
    const messages = ["fix: bug fix"];
    const githubMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubMock);
    const nextVersion = await getNextVersion(true);
    expect(nextVersion).toBe("1.2.1-rc.1");
  })

  test("prerelease identifier with a dot", async () => {
    setInputs({
      token: "token",
      prerelease_id: "alpha.r"
    });
    const messages = ["fix: bug fix"];
    const githubMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubMock);
    const nextVersion = await getNextVersion(true);
    expect(nextVersion).toBe("1.2.1-alpha.r.1");
  })

  test("prerelease identifier too long", async () => {
    setInputs({
      token: "token",
      prerelease_id: "overtenchar"
    })
    const messages = ["fix: bug fix"];
    const githubMock = mockGitHub(messages);
    github.getOctokit.mockImplementation((token) => githubMock);
    const nextVersion = await getNextVersion(true);
    expect(nextVersion).toBe(null);
    expect(core.setFailed).toHaveBeenCalledWith("prerelease_id is too long");
  })
});
