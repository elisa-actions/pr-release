const core = require("@actions/core");
const { GitHub, context } = require("@actions/github");
var conventionalCommitsParser = require("conventional-commits-parser");

const commitHeaders = {
  feat: "Features",
  feature: "Features",
  fix: "Bug Fixes",
  perf: "Performance Improvements",
  revert: "Reverts",
};

async function createReleaseNotes() {
  const token = core.getInput("github_token", { required: true });
  const octokit = new GitHub(token);
  if (context.issue) {
    const { owner, repo, number } = context.issue;
    const commits = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: number,
      per_page: 100,
    });
    const releaseNotes = {
      Features: [],
      "Bug Fixes": [],
      "Performance Improvements": [],
      Reverts: [],
    };
    commits.data.forEach(function (item) {
      const parsedCommit = conventionalCommitsParser.sync(item.commit.message);
      console.log(parsedCommit);
      if (parsedCommit.type in commitHeaders) {
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
        releaseNotes[commitHeaders[parsedCommit.type]].push(message + notes);
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
