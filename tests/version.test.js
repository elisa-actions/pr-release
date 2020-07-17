jest.mock("@actions/github");

const { GitHub, context } = require("@actions/github");
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
  const listRefs = jest
    .fn()
    .mockReturnValueOnce(
      Promise.resolve({
        data: [
          { ref: "refs/tags/1.2.0" },
          { ref: "refs/tags/1.1.1" },
          { ref: "refs/tags/1.1.0" },
          { ref: "refs/tags/1.2.1-rc.0" },
        ],
      })
    );
  const github = {
    pulls: {
      listCommits,
    },
    git: {
      listRefs,
    },
  };
  GitHub.mockImplementation(() => github);
  return github;
};

describe("Test versioning", () => {
  beforeEach(() => {
    context.issue = {
      owner: "owner",
      repo: "repo",
      number: 1,
    };
    context.repo = {
      repo: "repo"
    }
    setInputs({
      github_token: "token",
      prerelease_id: "rc",
    });
  });

  test("major version bump", async () => {
    const messages = ["fix!: repair something", "test: add unit tests"];
    const github = mockGitHub(messages);
    const nextVersion = await getNextVersion(false);
    expect(nextVersion).toBe("2.0.0");
    expect(github.pulls.listCommits).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      pull_number: 1,
      per_page: 100,
    })
    expect(github.git.listRefs).toHaveBeenCalledWith({
      repo: "repo",
      namespace: "tags/",
    })
  });

  test("minor version bump", async () => {
    const messages = ["feat: new feature", "test: test for feature"];
    mockGitHub(messages);
    const nextVersion = await getNextVersion(false);
    expect(nextVersion).toBe("1.3.0");
  })

  test("patch version bump", async () => {
    const messages = ["fix: bug fix", "test: test for bugfix"];
    mockGitHub(messages);
    const nextVersion = await getNextVersion(false);
    expect(nextVersion).toBe("1.2.1");
  })

  test("rc version", async () => {
    const messages = ["feat: new feature"];
    mockGitHub(messages);
    const nextVersion = await getNextVersion(true);
    expect(nextVersion).toBe("1.3.0-rc.0");
  })

  test("rc version with existing rc version", async () => {
    const messages = ["fix: bug fix"];
    mockGitHub(messages);
    const nextVersion = await getNextVersion(true);
    expect(nextVersion).toBe("1.2.1-rc.1");
  })
});
