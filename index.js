const core = require("@actions/core");
const github = require("@actions/github");
const { Base64 } = require("js-base64");
const axios = require("axios");
const cheerio = require("cheerio");

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

    core.info(JSON.stringify(pr))
    core.setOutput("ref", pr.data.head.ref);
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
      core.info("DIRTY")
      dirty = true;
      core.setOutput("dirty", dirty);
      const diffURL = pr.data.diff_url;
      const diff = await getDiff(diffURL);

      core.info(diff);
      core.setOutput("diff", diff);
      return;

      core.info("BUILD FILE")
      const content = await buildFile(raw_link, diff);
      core.info("CONTENT CREATED")
      const contentEncoded = Base64.encode(content);
      core.info("CONTENT ENCODED")

      // TODO: Error: Cannot read property 'createOrUpdateFileContents' of undefined
      core.info("REST")
      const allRepos = await octokit.rest.repos
      core.info(JSON.stringify(allRepos))
      const { data } = allRepos
      core.info(JSON.stringify(data))
      core.info("---")

      try {
        await octokit.rest.repos.createOrUpdateFileContents({
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
        core.info("Successfully updated file");
      } catch (error) {
        core.setFailed(error.message);
      }
      
      core.info("Cannot automatically merge this branch");
      return;
    };

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

async function getDiff(url) {
  let search, diff;
  const regex = /\+([a-zA-Z]+.*)/gm;
  try {
    const { data } = await axios.get(url);
    const html = cheerio.load(data).html();
    while ((search = regex.exec(html)) !== null) {
      if (search.index === regex.lastIndex) regex.lastIndex++;
      search.forEach((match, groupIndex) => {diff = match;});
    }
    return diff;
  } catch (error) {
    core.info("Most likely invalid URL");
    core.setFailed(error.message);
  }
}

async function buildFile(url, addition) {
  let search, content;
  core.info(1)
  const regex = /<body>(.*[\s\S]*)<\/body>/gm;
  core.info(2)
  try {
    const { data } = await axios.get(url);
    core.info(3)
    const html = cheerio.load(data).html();
    core.info("HTML")
    core.info(html)
    core.info("----------")
    while ((search = regex.exec(html)) !== null) {
      if (search.index === regex.lastIndex) regex.lastIndex++;
      search.forEach((match, groupIndex) => {
        content = match;
        core.info("CONTENT:  ");
        core.info(content)
        core.info("-------")
      });
    }
    content = content + addition;
  } catch (error) {
    core.info("Most likely invalid URL");
    core.setFailed(error.message);
  }
  return content
}

autoMerge();