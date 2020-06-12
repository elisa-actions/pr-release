const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");
const createReleaseNotes = require("./release-notes");

async function createReleaseData() {
  const token = core.getInput("github_token", { required: true });
  const includeReleaseNotes = (core.getInput("release_notes").toLowerCase() || "true") === "true";
  const octokit = new GitHub(token);
  const { owner, repo, number } = context.issue;
  const issue = await octokit.issues.get({
    owner,
    repo,
    issue_number: number,
  });
  const title = issue.data.title;
  let body = issue.data.body;
  if (includeReleaseNotes) {
    body = body.concat("\n\n", await createReleaseNotes());
  }
  core.setOutput("release_title", title);
  core.setOutput("release_body", body);
  return { title, body };
}

module.exports = createReleaseData;
