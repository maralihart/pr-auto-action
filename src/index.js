const core = require("@actions/core");
const github = require("@actions/github");

async function autoMerge() {
  try {
    const merge_method = core.getInput("merge-method");
    const payload = github.context.payload;
    
    const myToken = core.getInput("github-token");
    const octokit = github.getOctokit(myToken);

    const owner = payload.issue.user.login;
    const repo = payload.repository.name;
    const pr_number = payload.issue.number;

    // TODO: check to make sure only one line has been changed!
    // TODO: take care of merge conflicts?
    const diff = await octokit.rest.pulls.get({
      owner: owner,
      repo: repo,
      pull_number: pr_number
    });

    core.info("diff");
    core.info(JSON.stringify(diff));

    // TODO: merge 

    await octokit.rest.pulls.merge({
      owner: owner,
      repo: repo,
      pull_number: pr_number,
      merge_method: "merge"
    });

    core.info("PR successfully merged!");

  } catch (error) {
    core.setFailed(error.message);
  }
}

autoMerge();