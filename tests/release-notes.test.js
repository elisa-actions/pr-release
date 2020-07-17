jest.mock("@actions/github");
const { GitHub, context } = require("@actions/github");
const setInputs = require("./test-utils");
const createReleaseNotes = require("../src/release-notes");

let github;

beforeEach(() => {
  setInputs({
    github_token: "token",
  });
  context.issue = {
    owner: "owner",
    repo: "repo",
    number: 1,
  };
  github = {
    pulls: {
      listCommits: jest.fn().mockReturnValueOnce(
        Promise.resolve({
          data: [
            { commit: { message: "feat: new feature" }, sha: "sha1" },
            { commit: { message: "feature: other feature" }, sha: "sha2" },
            { commit: { message: "fix: bugfix" }, sha: "sha3" },
            {
              commit: { message: "perf: performance improvement" },
              sha: "sha4",
            },
            { commit: { message: "revert: revert" }, sha: "sha5" },
            { commit: { message: "test: shouldn't be listed" }, sha: "sha6" },
          ],
        })
      ),
    },
  };
  GitHub.mockImplementation(() => github);
});

test("create release notes", async () => {
  const releaseNotes = await createReleaseNotes();
  expect(releaseNotes).toBe(
    `<details><summary><strong>Features</strong></summary><p>

- new feature [sha1](undefined)
- other feature [sha2](undefined)

</p></details>
<details><summary><strong>Bug Fixes</strong></summary><p>

- bugfix [sha3](undefined)

</p></details>
<details><summary><strong>Performance Improvements</strong></summary><p>

- performance improvement [sha4](undefined)

</p></details>
<details><summary><strong>Reverts</strong></summary><p>

- revert [sha5](undefined)

</p></details>`
  );
});
