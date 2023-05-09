const core = require("@actions/core");
const { GitHub, context } = require("@actions/github");

async function getPR() {
  const token = core.getInput("github_token", { required: true });
  const octokit = new GitHub(token);
  const { owner, repo, number } = context.issue;
  const pr = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: number,
  });
  return pr;
}

module.exports = getPR;
