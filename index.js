const core = require("@actions/core");
const github = require("@actions/github");

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

    if (!oneLineAdded) {
      core.info("Too many lines were changed. PR cannot be merged");
      return;
    };

    if (mergeable == "dirty") {
      core.info("PR cannot be automatically merged.")
    }

    if (onlyOneChangedFile && oneLineAdded) {
      try {
        await octokit.rest.pulls.merge({
          owner: owner,
          repo: repo,
          pull_number: prNumber,
          merge_method: "merge"
        });
        core.info("PR successfully merged!");
      } catch (error) {
        core.info(error);
      }
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

autoMerge();