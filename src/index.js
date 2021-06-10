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

    const pr = await octokit.rest.pulls.get({
      owner: owner,
      repo: repo,
      pull_number: pr_number
    });

    const mergeable = pr.data.mergeable_state;
    const changed_files = pr.data.changed_files === 1;
    const additions = pr.data.additions;
    const deletions = pr.data.deletions;

    const oneLineAdded = additions === 1 && deletions === 0;
    const oneLineSwapped = additions === 2 && deletions === 1;

    core.info("mergeable");
    core.info(mergeable);

    core.info("changed_files");
    core.info(changed_files);

    core.info("additions");
    core.info(additions);

    core.info("deletions");
    core.info(deletions);

    core.info("oneLineAdded");
    core.info(oneLineAdded);

    core.info("oneLineSwapped");
    core.info(oneLineSwapped);

    // TODO: take care of merge conflicts?
    if (!mergeable) {
      core.info("can't merge, oop")
    }

    // TODO: check to make sure only one line has been changed!
    if (oneLineAdded || oneLineSwapped) {
      await octokit.rest.pulls.merge({
        owner: owner,
        repo: repo,
        pull_number: pr_number,
        merge_method: "merge"
      });

      core.info("PR successfully merged!");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

autoMerge();