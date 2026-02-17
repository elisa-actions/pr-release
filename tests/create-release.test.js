import { jest, beforeEach, afterEach, test, expect } from "@jest/globals";

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
const createRelease = (await import("../src/create-release.js")).default;

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
        createRelease: jest.fn().mockResolvedValueOnce(releaseResponse),
      },
    },
  };

  Object.assign(githubMockModule.context, {
    repo: {
      owner: "owner",
      repo: "repo",
    },
  });

  github.getOctokit.mockImplementation((token) => githubMock);
});

afterEach(() => {
  jest.resetAllMocks();
  Object.keys(githubMockModule.context).forEach((key) => {
    delete githubMockModule.context[key];
  });
});

test("create release", async () => {
  setInputs({
    github_token: "token",
    release_draft: "",
    prerelease_draft: "",
  });

  const response = await createRelease(
    "1.0.0",
    "sha",
    "release name",
    "release body",
    false
  );

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
  });
});

test("create release draft", async () => {
  setInputs({
    github_token: "token",
    release_draft: "true",
    prerelease_draft: "",
  });

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
  });
});

test("create prerelease", async () => {
  setInputs({
    github_token: "token",
    release_draft: "",
    prerelease_draft: "",
  });

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
  });
});

test("create prerelease draft", async () => {
  setInputs({
    github_token: "token",
    release_draft: "",
    prerelease_draft: "true",
  });

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
  });
});
