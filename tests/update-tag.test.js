jest.mock("@actions/github");
const github = require("@actions/github");
const setInputs = require("./test-utils");
const updateMajorTag = require("../src/update-tag");

let githubMock;

beforeEach(() => {
  githubMock = {
    rest: {
      git: {
        getRef: jest.fn(),
        updateRef: jest.fn(),
        createRef: jest.fn(),
      },
    },
  };
  jest.replaceProperty(github, "context", {
    repo: {
      owner: "owner",
      repo: "repo",
    },
  });
  github.getOctokit.mockImplementation((token) => githubMock);
});

test("major tag is updated", async () => {
  setInputs({ github_token: "token", update_major_tag: "true" });
  await updateMajorTag("1.2.0", "abcd1234");
  expect(githubMock.rest.git.getRef).toHaveBeenCalledWith({
    owner: "owner",
    ref: "tags/v1",
    repo: "repo",
  });
  expect(githubMock.rest.git.updateRef).toHaveBeenCalledWith({
    force: true,
    owner: "owner",
    ref: "tags/v1",
    repo: "repo",
    sha: "abcd1234",
  });
  expect(githubMock.rest.git.createRef).not.toHaveBeenCalled();
});

test("major tag is created", async () => {
  setInputs({ github_token: "token", update_major_tag: "true" });
  githubMock = {
    rest: {
      git: {
        getRef: jest.fn(() => Promise.reject("rejected")),
        updateRef: jest.fn(),
        createRef: jest.fn(),
      },
    },
  };
  await updateMajorTag("1.2.0", "abcd1234");
  expect(githubMock.rest.git.getRef).toHaveBeenCalledWith({
    owner: "owner",
    ref: "tags/v1",
    repo: "repo",
  });
  expect(githubMock.rest.git.updateRef).not.toHaveBeenCalled();
  expect(githubMock.rest.git.createRef).toHaveBeenCalledWith({
    owner: "owner",
    ref: "refs/tags/v1",
    repo: "repo",
    sha: "abcd1234",
  });
});

test("tag is not updated for prereleases", async () => {
  setInputs({ github_token: "token", update_major_tag: "true" });
  await updateMajorTag("1.2.0-rc.1", "abcd1234");
  expect(githubMock.rest.git.getRef).not.toHaveBeenCalled();
  expect(githubMock.rest.git.updateRef).not.toHaveBeenCalled();
  expect(githubMock.rest.git.createRef).not.toHaveBeenCalled();
});

test("tag is not updated when configuration is not enabled", async () => {
  setInputs({ github_token: "token", update_major_tag: "" });
  await updateMajorTag("1.2.0", "abcd1234");
  expect(githubMock.rest.git.getRef).not.toHaveBeenCalled();
  expect(githubMock.rest.git.updateRef).not.toHaveBeenCalled();
  expect(githubMock.rest.git.createRef).not.toHaveBeenCalled();
});
