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

    core.info("PR #: ", payload.pull_request_number)
    
    core.info(JSON.stringify(octokit.pulls));

    await octokit.pulls.merge({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      pull_number: payload.pull_request_number,
      merge_method: "merge",
    });

    core.info(`Success Merge PR!`);

    octokit.git.deleteRef({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      ref: payload.pull_request.head.sha
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

autoMerge();