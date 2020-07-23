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
