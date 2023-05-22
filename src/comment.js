const core = require("@actions/core");
const github = require("@actions/github");

async function addCommentReaction(comment_id, reaction) {
  const token = core.getInput("github_token", { required: true });
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.issue;
  return await octokit.rest.reactions.createForIssueComment({
    owner,
    repo,
    comment_id,
    content: reaction,
  });
}

async function addComment(message) {
  const token = core.getInput("github_token", { required: true });
  const octokit = github.getOctokit(token);
  const { owner, repo, number } = github.context.issue;
  return await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body: message,
  });
}

module.exports = { addCommentReaction, addComment };
