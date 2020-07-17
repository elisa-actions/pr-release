const core = require("@actions/core");
const { GitHub, context } = require("@actions/github");
const semver = require("semver");
const { analyzeCommits } = require("@semantic-release/commit-analyzer");

const cwd = process.cwd();
const PRERELEASE_ID_MAX_LENGTH = 10;

async function getNextVersion(prerelease) {
  const token = core.getInput("github_token", { required: true });
  const octokit = new GitHub(token);
  const { owner, repo, number } = context.issue;
  const { data: commits } = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number: number,
    per_page: 100,
  });
  const commitMessages = commits.map((commit) => commit.commit.message);

  const { data: refs } = await octokit.git
    .listRefs({
      ...context.repo,
      namespace: "tags/",
    })
    .catch(() => {
      return { data: [] };
    });
  console.log(refs);
  const versions = refs
    .map((ref) =>
      semver.parse(ref.ref.replace(/^refs\/tags\//g, ""), { loose: true })
    )
    .filter((version) => version !== null)
    .sort(semver.rcompare);
  const latestRelease =
    versions.filter((version) => semver.prerelease(version) === null)[0] ||
    semver.parse("0.0.0");
  console.log(`Latest release is "${latestRelease.toString()}"`);

  const identifier = core.getInput("prerelease_id", { required: false }) || "";
  if (identifier.length > PRERELEASE_ID_MAX_LENGTH) {
    core.setFailed("prerelease_id is too long");
    return null;
  }
  const bump = await getBumpLevel(commitMessages, prerelease);
  if (!bump) {
    return null;
  }
  console.log(`Bumping with ${bump}`);

  let version = semver.inc(latestRelease, bump, identifier);
  while (versions.filter((v) => v.version === version).length === 1) {
    version = semver.inc(version, "prerelease");
  }
  core.setOutput("version", version.toString());
  core.setOutput("bump", bump);
  return version;
}

async function getBumpLevel(commitArray, prerelease) {
  const commits = commitArray.map((message, index) => ({
    hash: index.toString(),
    message,
  }));
  const releaseType = await analyzeCommits(
    {
      preset: "conventionalcommits",
    },
    { cwd, commits, logger: console }
  );

  if (releaseType && prerelease) {
    return "pre" + releaseType;
  }
  return releaseType;
}

module.exports = getNextVersion;
