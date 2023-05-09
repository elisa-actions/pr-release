const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");
const createReleaseNotes = require("./release-notes");

async function createReleaseData() {
  const token = core.getInput("github_token", { required: true });
  const includeReleaseNotes = (core.getInput("release_notes").toLowerCase() || "true") === "true";
  const octokit = new GitHub(token);
  const { owner, repo, number } = context.issue;
  const issue = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: number,
  });
  const title = issue.data.title;
  let body = issue.data.body || "";
  body = removeDependabotInstructions(body);
  if (includeReleaseNotes) {
    body = body.concat("\n\n", await createReleaseNotes());
  }
  core.setOutput("release_title", title);
  core.setOutput("release_body", body);
  return { title, body };
}

function removeDependabotInstructions(body) {
  const instructionPosition = body.indexOf("Dependabot will resolve any conflicts with this PR");
  if (instructionPosition === -1) {
    return body;
  }
  return body.substring(0, instructionPosition).trim();
}

module.exports = createReleaseData;
