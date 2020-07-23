jest.mock("@actions/github");

const { GitHub, context } = require("@actions/github");

const setInputs = require("./test-utils");
const getPR = require("../src/pr");

beforeEach(() => {
  setInputs({
    github_token: "token",
  });
  context.issue = {
    owner: "owner",
    repo: "repo",
    number: 1,
  };
});

test("get pull request", async () => {
  dummyPR = { data: { head: { sha: "sha " } } };
  const github = {
    pulls: {
      get: jest.fn().mockReturnValueOnce(Promise.resolve(dummyPR)),
    },
  };
  GitHub.mockImplementation(() => github);

  const pr = await getPR();

  expect(pr).toEqual(dummyPR);
  expect(github.pulls.get).toHaveBeenCalledWith({
    owner: "owner",
    repo: "repo",
    pull_number: 1,
  })
});
