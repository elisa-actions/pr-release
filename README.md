# PR Release Action

GitHub Action for creating semantic releases automatically when a pull request gets merged. The commit message format should follow the [conventional commits specification](https://www.conventionalcommits.org/en/v1.0.0/).

A prerelease can be created from a PR by commenting it with `/prerelease`. This  creates a new release with a configurable prerelease identifier and "Pre-release" tag on the GitHub release. If you have configured `prerelease_id` (for example "rc") it will be used to prefix the prerelease increment like this: `1.2.3-rc.0`.

The release title is obtained from the pull request title and the release body also starts with the body message from the PR. Release notes are automatically generated and grouped by commit types. You can opt out of the release note generation with the `release_notes` input variable.

## Configuration

The action should be configured to run on closed pull requests and issue comments. The action is able to distinguish when PR has been merged and when it has been closed without merging.

Here is an example workflow file:

```yaml
name: Release

on:
  pull_request:
    types: ["closed"]
  issue_comment:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Clone PR branch
        uses: actions/checkout@v2
      - name: Create release
        uses: ./.github/actions/semantic-release
        with: ElisaOyj/gh-action-pr-release
          github_token: ${{ secrets.GITHUB_TOKEN }}
          prerelease_id: "rc"
```

## Inputs

| name              | required | description |
|-------------------|----------|-------------|
| `github_token`    | yes      | GitHub token |
| `prerelease_id`   | no       | Prerelease identifier |
| `dry_run`         | no       | Skip release creation, set outputs |
| `release_notes`   | no       | Include release notes (default: true) |
| `release_draft`   | no       | Publish releases as draft |
| `prerelease_draft`| no       | Publish prereleases as draft |

## Outputs

| name                 | description |
|----------------------|-------------|
| `bump`               | Bump level |
| `version`            | Release version |
| `release_title`      | Release title |
| `release_body`       | Release body |
| `release_id`         | ID of the created release |
| `release_url`        | HTML URL of the release |
| `release_upload_url` | Upload URL of the release |
