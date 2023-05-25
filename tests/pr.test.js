jest.mock("@actions/github");

const setInputs = require("./test-utils");
const getPR = require("../src/pr");
const github = require("@actions/github");

beforeEach(() => {
  setInputs({
    github_token: "token",
  });
});

test("get pull request", async () => {
  dummyPR = { data: { head: { sha: "sha " } } };
  const mockGithub = {
    rest: {
      pulls: {
        get: jest.fn().mockResolvedValueOnce(dummyPR),
      },
    },
  };
  github.getOctokit.mockImplementation((token) => mockGithub);
  jest.replaceProperty(github, "context", {
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
  })
});
