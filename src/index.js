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
    core.info("---OCTOKIT---")
    core.info(myToken.length);
    core.info(JSON.stringify(octokit));

    core.info("PR #: ", payload.issue.number)
    const owner = payload.issue.user.login;
    const repo = payload.repository.name;
    const pr_number = payload.issue.number;

    core.info("owner: ")
    core.info(owner)
    core.info("repo: ")
    core.info(repo)
    core.info("pr_number: ")
    core.info(pr_number);

    const allPullRequests = await octokit.rest.pulls.list({
      owner,
      repo,
    });
    
    core.info(JSON.stringify(allPullRequests));

    const { data } = allPullRequests;
    coore.info(data);

    // TODO: check to make sure only one line has been changed!

    // TODO: merge 

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