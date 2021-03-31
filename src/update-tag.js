const core = require("@actions/core");
const { GitHub, context } = require("@actions/github");
const semver = require("semver");

async function updateMajorTag(version, sha) {
  if (core.getInput("update_major_tag") !== "true" || semver.prerelease(version)) {
    return;
  }
  const token = core.getInput("github_token", { required: true });
  const octokit = new GitHub(token);
  const majorVersion = semver.major(version);
  const majorTag = `v${majorVersion}`;
  const { owner, repo } = context.repo;

  try {
    await octokit.git.getRef({
      owner,
      repo,
      ref: `tags/${majorTag}`,
    });
    await octokit.git.updateRef({
      owner,
      repo,
      sha,
      ref: `tags/${majorTag}`,
      force: true,
    });
  } catch {
    // ref didn't exist
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/tags/${majorTag}`,
      sha,
    });
  }
}

module.exports = updateMajorTag;
