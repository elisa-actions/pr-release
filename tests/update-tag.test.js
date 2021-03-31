jest.mock("@actions/github");
const { GitHub, context } = require("@actions/github");
const setInputs = require("./test-utils");
const updateMajorTag = require("../src/update-tag");

let github;

beforeEach(() => {
  context.repo = {
    owner: "owner",
    repo: "repo",
  };
  github = {
    git: {
      getRef: jest.fn(),
      updateRef: jest.fn(),
      createRef: jest.fn(),
    },
  };
  GitHub.mockImplementation(() => github);
});

test("major tag is updated", async () => {
  setInputs({ github_token: "token", update_major_tag: "true" });
  await updateMajorTag("1.2.0", "abcd1234");
  expect(github.git.getRef).toHaveBeenCalledWith({
    owner: "owner",
    ref: "tags/v1",
    repo: "repo",
  });
  expect(github.git.updateRef).toHaveBeenCalledWith({
    force: true,
    owner: "owner",
    ref: "tags/v1",
    repo: "repo",
    sha: "abcd1234",
  });
  expect(github.git.createRef).not.toHaveBeenCalled();
});

test("major tag is created", async () => {
  setInputs({ github_token: "token", update_major_tag: "true" });
  github.git.getRef.mockImplementation(() => {
    throw new Error();
  });
  await updateMajorTag("1.2.0", "abcd1234");
  expect(github.git.getRef).toHaveBeenCalledWith({
    owner: "owner",
    ref: "tags/v1",
    repo: "repo",
  });
  expect(github.git.updateRef).not.toHaveBeenCalled();
  expect(github.git.createRef).toHaveBeenCalledWith({
    owner: "owner",
    ref: "refs/tags/v1",
    repo: "repo",
    sha: "abcd1234",
  });
});

test("tag is not updated for prereleases", async () => {
  setInputs({ github_token: "token", update_major_tag: "true" });
  await updateMajorTag("1.2.0-rc.1", "abcd1234");
  expect(github.git.getRef).not.toHaveBeenCalled();
  expect(github.git.updateRef).not.toHaveBeenCalled();
  expect(github.git.createRef).not.toHaveBeenCalled();
});

test("tag is not updated when configuration is not enabled", async () => {
  setInputs({ github_token: "token", update_major_tag: "" });
  await updateMajorTag("1.2.0", "abcd1234");
  expect(github.git.getRef).not.toHaveBeenCalled();
  expect(github.git.updateRef).not.toHaveBeenCalled();
  expect(github.git.createRef).not.toHaveBeenCalled();
});
