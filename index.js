const core = require("@actions/core");
const { context } = require("@actions/github");
const getNextVersion = require("./src/version");
const getPR = require("./src/pr");
const createReleaseData = require("./src/release-data");
const createRelease = require("./src/create-release");
const { addComment, addCommentReaction } = require("./src/comment");

async function run() {
  try {
    let prerelease = false;
    let commitSha = null;
    if (context.payload.action === "closed") {
      const pr = await getPR();
      commitSha = pr.data.head.sha;
      if (!pr.data.merged) {
        console.log(`PR #${number} was closed.`);
        return;
      }
    } else if (["created", "edited"].includes(context.payload.action)) {
      if (context.payload["comment"]["body"] === "/prerelease") {
        prerelease = true;
        const pr = await getPR();
        commitSha = pr.data.head.sha;
        addCommentReaction(context.payload.comment.id, "rocket");
      } else {
        return;
      }
    } else {
      console.log(`Action ${context.payload.action} not supported`);
      return;
    }

    // Check version
    const version = await getNextVersion(prerelease);
    if (!version) {
      addComment("New release not required :sparkles:");
      return;
    }

    // Build release data and expose as output variables
    const releaseData = await createReleaseData();

    // Create release
    if (core.getInput("dry_run") !== "true") {
      console.log("Create release");
      const release = await createRelease(
        version.toString(),
        commitSha,
        releaseData.title,
        releaseData.body,
        prerelease
      );
      addComment(
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

run();
