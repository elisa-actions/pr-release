const core = require("@actions/core");
const github = require("@actions/github");
const getNextVersion = require("./version");
const getPR = require("./pr");
const createReleaseData = require("./release-data");
const createRelease = require("./create-release");
const { addComment, addCommentReaction } = require("./comment");
const updateMajorTag = require("./update-tag");

async function run() {
  try {
    let prerelease = false;
    let dry_run = core.getInput("dry_run") === "true";
    let commitSha = null;
    if (github.context.payload.action === "closed") {
      const pr = await getPR();
      commitSha = pr.data.head.sha;
      if (!pr.data.merged) {
        console.log(`PR #${pr.data.number} was closed.`);
        return;
      }
    } else if (["created", "edited"].includes(github.context.payload.action)) {
      const comment = github.context.payload["comment"]["body"];
      if (comment && comment.trim() === "/prerelease") {
        prerelease = true;
        const pr = await getPR();
        commitSha = pr.data.head.sha;
        await addCommentReaction(github.context.payload.comment.id, "rocket");
      } else {
        return;
      }
    } else if (dry_run) {
      await getNextVersion(false);
      return;
    } else {
      console.log(`Action ${github.context.payload.action} not supported`);
      return;
    }
    // Check version
    const version = await getNextVersion(prerelease);
    if (!version) {
      await addComment("New release not required :sparkles:");
      return;
    }

    // Build release data and expose as output variables
    const releaseData = await createReleaseData();

    // Create release
    if (!dry_run) {
      console.log("Create release");
      const release = await createRelease(
        version.toString(),
        commitSha,
        releaseData.title,
        releaseData.body,
        prerelease
      );
      await updateMajorTag(version, commitSha);
      await addComment(
        `Version [${version}](${release.html_url}) ${
          release.draft ? "drafted" : "released"
        }! :zap:`
      );
    }
  } catch (error) {
    console.trace();
    console.log(error);
    core.setFailed(error.message);
  }
}

module.exports = run;
