const core = require("@actions/core");
const github = require("@actions/github");
const { Toolkit } = require("actions-toolkit");
const tools = new Toolkit();

async function autoMerge() {
  try {
    const merge_method = core.getInput("merge-method");
    
    const myToken = core.getInput("github-token");
    const pulls = github.getOctokit(myToken).rest.pulls;

    const ref = tools.context.ref;
    const pull_number = Number(ref.split("/")[2]);
    core.info("PR #: ", pull_number)
    
    core.info(pulls)

    const pr = await pulls.get({
      ...github.context.repo,
      pull_number,
    });

    pulls.merge({
      ...github.context.repo,
      pull_number,
      merge_method,
    });
    core.info(`Success Merge PR!`);

    core.info("The Bot will remove merged branch.");
    octokit.git.deleteRef({
      ...github.context.repo,
      ref,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

autoMerge();