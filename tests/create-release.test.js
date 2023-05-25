jest.mock("@actions/github");
const github = require("@actions/github");
const setInputs = require("./test-utils");

const createRelease = require("../src/create-release");

let releaseResponse;
let githubMock;

beforeEach(() => {
  releaseResponse = {
    data: {
      id: "release_id",
      html_url: "http://localhost/release",
      release_upload_url: "http://localhost/upload",
    },
  };
  githubMock = {
    rest: {
      repos: {
        createRelease: jest
            .fn()
            .mockReturnValueOnce(Promise.resolve(releaseResponse)),
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

test("create release", async () => {
  setInputs({
    github_token: "token",
    release_draft: "",
    prerelease_draft: "",
  })
  const response = await createRelease("1.0.0", "sha", "release name", "release body", false)
  expect(response).toEqual(releaseResponse.data);
  expect(githubMock.rest.repos.createRelease).toHaveBeenCalledWith({
    owner: "owner",
    repo: "repo",
    tag_name: "1.0.0",
    target_commitish: "sha",
    name: "release name",
    body: "release body",
    draft: false,
    prerelease: false,
  })
});

test("create release draft", async () => {
  setInputs({
    github_token: "token",
    release_draft: "true",
    prerelease_draft: "",
  })
  await createRelease("1.0.0", "sha", "release name", "release body", false);
  expect(githubMock.rest.repos.createRelease).toHaveBeenCalledWith({
    owner: "owner",
    repo: "repo",
    tag_name: "1.0.0",
    target_commitish: "sha",
    name: "release name",
    body: "release body",
    draft: true,
    prerelease: false,
  })
})

test("create prerelease", async () => {
  setInputs({
    github_token: "token",
    release_draft: "",
    prerelease_draft: ""
  })
  await createRelease("1.0.0", "sha", "release name", "release body", true);
  expect(githubMock.rest.repos.createRelease).toHaveBeenCalledWith({
    owner: "owner",
    repo: "repo",
    tag_name: "1.0.0",
    target_commitish: "sha",
    name: "release name",
    body: "release body",
    draft: false,
    prerelease: true,
  })
})

test("create prerelease draft", async () => {
  setInputs({
    github_token: "token",
    release_draft: "",
    prerelease_draft: "true",
  })
  await createRelease("1.0.0", "sha", "release name", "release body", true);
  expect(githubMock.rest.repos.createRelease).toHaveBeenCalledWith({
    owner: "owner",
    repo: "repo",
    tag_name: "1.0.0",
    target_commitish: "sha",
    name: "release name",
    body: "release body",
    draft: true,
    prerelease: true,
  })
})