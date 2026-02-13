import * as core from "@actions/core";
import * as github from "@actions/github";

export default async function getPR() {
  const token = core.getInput("github_token", { required: true });
  const octokit = github.getOctokit(token);
  const { owner, repo, number } = github.context.issue;
  const pr = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: number,
  });
  return pr;
}
