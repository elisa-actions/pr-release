jest.mock("@actions/github");
const github = require("@actions/github");
const setInputs = require("./test-utils");
const createReleaseNotes = require("../src/release-notes");

beforeEach(() => {
  setInputs({
    github_token: "token",
  });
  let githubMock = {
    rest: {
      pulls: {
        listCommits: jest.fn().mockReturnValueOnce(
            Promise.resolve({
              data: [
                {commit: {message: "feat: new feature"}, sha: "sha1"},
                {commit: {message: "feature: other feature"}, sha: "sha2"},
                {commit: {message: "fix: bugfix"}, sha: "sha3"},
                {
                  commit: {message: "perf: performance improvement"},
                  sha: "sha4",
                },
                {commit: {message: "revert: revert"}, sha: "sha5"},
                {commit: {message: "test: shouldn't be listed"}, sha: "sha6"},
                {
                  commit: {message: "fix(review): shouldn't be listed"},
                  sha: "sha7"
                },
                {
                  commit: {message: "fix(deps): bump package"},
                  sha: "sha8"
                },
                {
                  commit: {message: "fix(frontend): UI fixed"},
                  sha: "sha9"
                },
              ],
            })
        ),
      },
    },
  };
  jest.replaceProperty(github, "context", {
    issue: {
      owner: "owner",
      repo: "repo",
      number: 1,
    },
  });
  github.getOctokit.mockImplementation((token) => githubMock);
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
- **frontend:** UI fixed [sha9](undefined)

</p></details>
<details><summary><strong>Dependencies</strong></summary><p>

- **deps:** bump package [sha8](undefined)

</p></details>
<details><summary><strong>Performance Improvements</strong></summary><p>

- performance improvement [sha4](undefined)

</p></details>
<details><summary><strong>Reverts</strong></summary><p>

- revert [sha5](undefined)

</p></details>`
  );
});
