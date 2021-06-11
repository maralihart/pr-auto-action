const core = require("@actions/core");
const github = require("@actions/github");
const { Base64 } = require("js-base64");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function autoMerge() {
  try {
    const payload = github.context.payload;
    const filepath = core.getInput("filepath");
    const raw_link = core.getInput("raw_link");
    const email = core.getInput("email");
    const myToken = core.getInput("github-token");
    const octokit = github.getOctokit(myToken);

    const owner = payload.issue.user.login;
    const repo = payload.repository.name;
    const prNumber = payload.issue.number;

    const pr = await octokit.rest.pulls.get({
      owner: owner,
      repo: repo,
      pull_number: prNumber
    });

    const mergeable = pr.data.mergeable_state;
    const onlyOneChangedFile = pr.data.changed_files === 1;
    const additions = pr.data.additions;
    const deletions = pr.data.deletions;
    const oneLineAdded = additions === 1 && deletions === 0;

    if (!oneLineAdded) {
      core.info("Too many lines were changed. PR cannot be merged");
      return;
    };

    // TODO: Fix "dirty" PRs

    if (mergeable == "dirty") {
      // TODO: take care of merge conflicts?
      const diffURL = pr.data.diff_url;
      const diff = await getDiff(diffURL);

      core.info("DIFF");
      core.info(diff);
      core.info("-----------");

      const content = await buildFile(raw_link, diff);
      const contentEncoded = Base64.encode(content);

      await octokit.repos.createOrUpdateFileContents({
        repo: repo,
        path: filepath,
        message: `Update location.txt with ${owner}'s hometown`,
        content: contentEncoded,
        committer: {
          name: "GitHub-Actions",
          email: email,
        },
        author: {
          name: owner,
          email: email,
        }
      })

      core.info("Cannot automatically merge this branch");
      return;
    };

    if (onlyOneChangedFile && oneLineAdded) {
      await octokit.rest.pulls.merge({
        owner: owner,
        repo: repo,
        pull_number: prNumber,
        merge_method: "merge"
      });

      core.info("PR successfully merged!");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getDiff(url) {
  let search, diff;
  const regex = /\+([a-zA-Z]+.*)/gm;
  const { data } = await axios.get(url);
  const html = cheerio.load(data).html();
  while ((search = regex.exec(html)) !== null) {
    if (search.index === regex.lastIndex) regex.lastIndex++;
    search.forEach((match, groupIndex) => {diff = match;});
  }
  return diff;
}

async function buildFile(url, addition) {
  let search, diff;
  const regex = /<pre[\S\s]+>([\S.]*)<\/pre>/gm;
  const { data } = await axios.get(url);
  const html = cheerio.load(data).html();
  core.info("html");
  core.info(html);
  core.info("----");
  while ((search = regex.exec(html)) !== null) {
    if (search.index === regex.lastIndex) regex.lastIndex++;
    search.forEach((match, groupIndex) => {
      core.info("match");
      core.info(match);
      core.info("----")
      diff = match;
    });
  }
}

autoMerge();