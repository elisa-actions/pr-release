import * as core from "@actions/core";
import * as github from "@actions/github";
import { CommitParser } from "conventional-commits-parser";

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
    const parser = new CommitParser();
    commits.data.forEach(function (item) {
      const parsedCommit = parser.parse(item.commit.message);
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

export default createReleaseNotes;
