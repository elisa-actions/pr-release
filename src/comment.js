const core = require("@actions/core");
const { GitHub, context } = require("@actions/github");

async function addCommentReaction(comment_id, reaction) {
  const token = core.getInput("github_token", { required: true });
  const octokit = new GitHub(token);
  const { owner, repo } = context.issue;
  octokit.reactions.createForIssueComment({
    owner,
    repo,
    comment_id,
    content: reaction,
  });
}

async function addComment(message) {
  const token = core.getInput("github_token", { required: true });
  const octokit = new GitHub(token);
  const { owner, repo, number } = context.issue;
  octokit.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body: message,
  });
}

module.exports = { addCommentReaction, addComment };
