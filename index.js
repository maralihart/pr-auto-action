const core = require("@actions/core");
const github = require("@actions/github");

const axios = require("axios");
const cheerio = require("cheerio");

async function autoMerge() {
  try {
    const payload = github.context.payload;
    
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

    // TODO: take care of merge conflicts?
    if (!mergeable && oneLineAdded) {
      const diffURL = pr.data.diff_url;
      const diff = await getDiff(diffURL);
      core.info("diff");
      core.info(diff);
      // make a new copy?
      // delete old pr
      // call the commit a version of the person's name?
      core.info("can't merge, oop")
    }

    if (onlyOneChangedFile && oneLineAdded) {
      await octokit.rest.pulls.merge({
        owner: owner,
        repo: repo,
        pull_number: prNumber,
        merge_method: "merge"
      });

      if (!oneLineAdded) {
        // TODO: add a comment to the PR saying that only one line can be changed
        octokit.rest.pulls.createReviewComment({
          owner: owner,
          repo: repo,
          pull_number: prNumber,
          body: "Try changing your code so you're only adding your hometown, then ask someone else to comment again for it to automatically merge!",
        });
      }

      core.info("PR successfully merged!");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getDiff(url) {
  const regex = /\+[a-zA-Z]+[\s\S]*/gm;

  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const txt = $('pre'.text());

  let search;
  let diff;
  while ((search = regex.exec(str)) !== null) {
    if (search.index === regex.lastIndex) regex.lastIndex++;

    search.forEach((match, groupIndex) => {
      diff = match;
    });

  return diff
}

}

autoMerge();