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

await jest.unstable_mockModule("@actions/github", () => githubMockModule);
await jest.unstable_mockModule("@actions/core", () => coreMockModule);

const github = await import("@actions/github");
const setInputs = (await import("./test-utils.js")).default;
const getPR = (await import("../src/pr.js")).default;

beforeEach(() => {
  setInputs({
    github_token: "token",
  });
});

test("get pull request", async () => {
  const dummyPR = { data: { head: { sha: "sha " } } };
  const mockGithub = {
    rest: {
      pulls: {
        get: jest.fn().mockResolvedValueOnce(dummyPR),
      },
    },
  };

  github.getOctokit.mockImplementation((token) => mockGithub);
  Object.assign(githubMockModule.context, {
    issue: {
      owner: "owner",
      repo: "repo",
      number: 1,
    },
  });

  const pr = await getPR();

  expect(pr).toEqual(dummyPR);
  expect(mockGithub.rest.pulls.get).toHaveBeenCalledWith({
    owner: "owner",
    repo: "repo",
    pull_number: 1,
  });
});
