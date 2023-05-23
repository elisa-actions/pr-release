require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 314:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(613);
const github = __nccwpck_require__(58);

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


/***/ }),

/***/ 137:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(613);
const github = __nccwpck_require__(58);

async function createRelease(version, commitSha, name, body, prerelease) {
  const token = core.getInput("github_token", { required: true });
  const releaseDraft = core.getInput("release_draft").toLowerCase() === 'true'
  const preReleaseDraft = core.getInput("prerelease_draft").toLowerCase() === 'true'
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

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


/***/ }),

/***/ 541:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(613);
const github = __nccwpck_require__(58);
const getNextVersion = __nccwpck_require__(226);
const getPR = __nccwpck_require__(109);
const createReleaseData = __nccwpck_require__(411);
const createRelease = __nccwpck_require__(137);
const { addComment, addCommentReaction } = __nccwpck_require__(314);
const updateMajorTag = __nccwpck_require__(88);

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


/***/ }),

/***/ 109:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(613);
const github = __nccwpck_require__(58);

async function getPR() {
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

module.exports = getPR;


/***/ }),

/***/ 411:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(613);
const github = __nccwpck_require__(58);
const createReleaseNotes = __nccwpck_require__(530);

async function createReleaseData() {
  const token = core.getInput("github_token", { required: true });
  const includeReleaseNotes = (core.getInput("release_notes").toLowerCase() || "true") === "true";
  const octokit = github.getOctokit(token);
  const { owner, repo, number } = github.context.issue;
  const issue = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: number,
  });
  const title = issue.data.title;
  let body = issue.data.body || "";
  body = removeDependabotInstructions(body);
  if (includeReleaseNotes) {
    body = body.concat("\n\n", await createReleaseNotes());
  }
  core.setOutput("release_title", title);
  core.setOutput("release_body", body);
  return { title, body };
}

function removeDependabotInstructions(body) {
  const instructionPosition = body.indexOf("Dependabot will resolve any conflicts with this PR");
  if (instructionPosition === -1) {
    return body;
  }
  return body.substring(0, instructionPosition).trim();
}

module.exports = createReleaseData;


/***/ }),

/***/ 530:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(613);
const github = __nccwpck_require__(58);
let conventionalCommitsParser = __nccwpck_require__(630);

const commitHeaders = {
  feat: "Features",
  feature: "Features",
  fix: "Bug Fixes",
  "fix(deps)": "Dependencies",
  perf: "Performance Improvements",
  revert: "Reverts",
};

const ignoreScopes = ["fix(review)"];

async function createReleaseNotes() {
  const token = core.getInput("github_token", { required: true });
  const octokit = github.getOctokit(token);
  if (github.context.issue) {
    const { owner, repo, number } = github.context.issue;
    const commits = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: number,
      per_page: 100,
    });
    const releaseNotes = {
      Features: [],
      "Bug Fixes": [],
      Dependencies: [],
      "Performance Improvements": [],
      Reverts: [],
    };
    commits.data.forEach(function (item) {
      const parsedCommit = conventionalCommitsParser.sync(item.commit.message);
      console.log(parsedCommit);
      const scopedType = parsedCommit.scope
          ? `${parsedCommit.type}(${parsedCommit.scope})`
          : parsedCommit.type;
      const header = scopedType in commitHeaders
          ? commitHeaders[scopedType]
          : commitHeaders[parsedCommit.type];
      if (header && !ignoreScopes.includes(scopedType)) {
        const scope = parsedCommit.scope ? `**${parsedCommit.scope}:** ` : "";
        const message = `- ${scope}${parsedCommit.subject} [${item.sha.slice(
          0,
          6
        )}](${item.html_url})`;
        const notesArray = [];
        if (parsedCommit.notes) {
          parsedCommit.notes.forEach((note) =>
            notesArray.push(`    **${note.title}** ${note.text}`)
          );
        }
        const notes = notesArray.length ? `\n${notesArray.join("\n")}` : "";
        releaseNotes[header].push(message + notes);
      }
    });
    const notesArray = [];
    for (let [key, value] of Object.entries(releaseNotes)) {
      if (value.length) {
        notesArray.push(
          `<details><summary><strong>${key}</strong></summary><p>\n`
        );
        value.forEach((message) => notesArray.push(message));
        notesArray.push("\n</p></details>");
      }
    }
    return notesArray.join("\n");
  }
}

module.exports = createReleaseNotes;


/***/ }),

/***/ 88:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(613);
const github = __nccwpck_require__(58);
const semver = __nccwpck_require__(934);

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

module.exports = updateMajorTag;


/***/ }),

/***/ 226:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(613);
const github = __nccwpck_require__(58);
const semver = __nccwpck_require__(934);
const { analyzeCommits } = __nccwpck_require__(4);

const cwd = process.cwd();
const PRERELEASE_ID_MAX_LENGTH = 10;

async function getNextVersion(prerelease) {
  const token = core.getInput("github_token", { required: true });
  const octokit = github.getOctokit(token);
  const { owner, repo, number } = github.context.issue;
  const { data: commits } = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number: number,
    per_page: 100,
  });
  const commitMessages = commits.map((commit) => commit.commit.message);

  const { data: refs } = await octokit.rest.git
    .listRefs({
      ...github.context.repo,
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
    core.setOutput("version", null);
    core.setOutput("bump", null);
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


/***/ }),

/***/ 613:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 58:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 4:
/***/ ((module) => {

module.exports = eval("require")("@semantic-release/commit-analyzer");


/***/ }),

/***/ 630:
/***/ ((module) => {

module.exports = eval("require")("conventional-commits-parser");


/***/ }),

/***/ 934:
/***/ ((module) => {

module.exports = eval("require")("semver");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const run = __nccwpck_require__(541);

if (require.main === require.cache[eval('__filename')]) {
  run();
}

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map