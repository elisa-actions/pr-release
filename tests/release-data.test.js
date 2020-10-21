jest.mock("@actions/github");
jest.mock("../src/release-notes");
const setInputs = require("./test-utils");

const { GitHub, context } = require("@actions/github");
const createReleaseNotes = require("../src/release-notes");

const createReleaseData = require("../src/release-data");


beforeEach(() => {
  context.issue = {
    owner: "owner",
    repo: "repo",
    number: 1,
  };
  const issue = {
    data: {
      title: "Issue title",
      body: "Issue body",
    }
  }
  const github = {
    issues: {
      get: jest.fn().mockReturnValueOnce(Promise.resolve(issue))
    }
  }
  GitHub.mockImplementation(() => github)
  createReleaseNotes.mockReturnValueOnce(Promise.resolve("release note data"));
});

test("create release data", async () => {
  setInputs({
    github_token: "token",
    release_notes: "true",
  })

  const releaseData = await createReleaseData();

  expect(releaseData).toEqual({
      title: "Issue title",
      body: "Issue body\n\nrelease note data"
  });
});

test("create release data default release notes", async () => {
  setInputs({
    github_token: "token",
    release_notes: "",
  })

  const releaseData = await createReleaseData();

  expect(releaseData).toEqual({
      title: "Issue title",
      body: "Issue body\n\nrelease note data"
  });
});

test("create release data without release notes", async () => {
  setInputs({
    github_token: "token",
    release_notes: "false",
  })

  const releaseData = await createReleaseData();

  expect(releaseData).toEqual({
      title: "Issue title",
      body: "Issue body"
  });
});

test("Dependabot instructions are removed from release notes", async () => {
  setInputs({
    github_token: "token",
    release_notes: "true",
  })

  const issue = {
    data: {
      title: "Issue title",
      body: "Dependabot body\n\nDependabot will resolve any conflicts with this PR as long as you don't alter it yourself. You can also trigger a rebase manually by commenting `@dependabot rebase`.",
    }
  }
  const github = {
    issues: {
      get: jest.fn().mockReturnValueOnce(Promise.resolve(issue))
    }
  }
  GitHub.mockImplementation(() => github)

  const releaseData = await createReleaseData();

  expect(releaseData).toEqual({
      title: "Issue title",
      body: "Dependabot body\n\nrelease note data"
  });
});
