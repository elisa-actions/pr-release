import * as core from "@actions/core";
import * as github from "@actions/github";
import semver from "semver";

async function updateMajorTag(version, sha) {
  if (core.getInput("update_major_tag") !== "true" || semver.prerelease(version)) {
    return;
  }
  const token = core.getInput("github_token", { required: true });
  const octokit = github.getOctokit(token);
  const majorVersion = semver.major(version);
  const majorTag = `v${majorVersion}`;
  const { owner, repo } = github.context.repo;

  try {
    await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `tags/${majorTag}`,
    });
    await octokit.rest.git.updateRef({
      owner,
      repo,
      sha,
      ref: `tags/${majorTag}`,
      force: true,
    });
  } catch {
    // ref didn't exist
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/tags/${majorTag}`,
      sha,
    });
  }
}

export default updateMajorTag;
