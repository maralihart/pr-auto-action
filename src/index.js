const core = require("@actions/core");
const github = require("@actions/github");

async function autoMerge() {
  try {
    const merge_method = core.getInput("merge-method");
    const payload = github.context.payload;

    core.info("---PAYLOAD---")
    core.info(JSON.stringify(payload));
    
    const myToken = core.getInput("github-token");
    const octokit = github.getOctokit(myToken);

    core.info("PR #: ", payload.issue.number)
    const owner = payload.issue.user.login;
    const repo = payload.repository.name;
    const pr_number = payload.issue.number;

    await octokit.pulls.merge({
      owner: owner,
      repo: repo,
      pull_number: pr_number,
      merge_method: "merge",
    });

    core.info("PR successfully merged!");

  } catch (error) {
    core.setFailed(error.message);
  }
}

autoMerge();