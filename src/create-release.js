const core = require("@actions/core");
const { GitHub, context } = require("@actions/github");

async function createRelease(version, commitSha, name, body, prerelease) {
  const token = core.getInput("github_token", { required: true });
  const releaseDraft = core.getInput("release_draft").toLowerCase() === 'true'
  const preReleaseDraft = core.getInput("prerelease_draft").toLowerCase() === 'true'
  const octokit = new GitHub(token);
  const { owner, repo } = context.repo;

  const response = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: version,
    target_commitish: commitSha,
    name,
    body,
    draft: prerelease ? preReleaseDraft : releaseDraft,
    prerelease,
  });

  core.setOutput("release_id", response.data.id);
  core.setOutput("release_url", response.data.html_url);
  core.setOutput("release_upload_url", response.data.upload_url);
  return response.data;
}

module.exports = createRelease;
