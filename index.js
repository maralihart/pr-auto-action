const core = require("@actions/core");
const github = require("@actions/github");
const { Base64 } = require("js-base64");
const axios = require("axios");
const cheerio = require("cheerio");

async function autoMerge() {
  try {
    const payload = github.context.payload;
    const filepath = core.getInput("filepath");
    const raw_link = core.getInput("raw-link");
    const email = core.getInput("email");
    const myToken = core.getInput("github-token");
    const apiLink = core.getInput("file-link")
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
    const oneLineAdded = additions === 1 && deletions <= 1;

    if (!oneLineAdded) {
      core.setFailed("Too many lines were changed. PR cannot be merged");
      return;
    };

    if (mergeable == "dirty") {
      
      const diffURL = pr.data.diff_url;
      const diff = await getDiff(diffURL);
      const content = await buildFile(raw_link, diff);
      const contentEncoded = Base64.encode(content);
      let sha = ""

      try {
        const { data } = await axios.get(apiLink);
        sha = data.sha;
      } catch (error) {
        core.info("Most likely invalid URL");
        core.setFailed(error.message);
      }

      try {
        core.info('entered this try')
        core.info(pr.data.state);
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: owner,
          repo: repo,
          path: filepath,
          message: `Update location.txt with ${owner}'s hometown`,
          content: contentEncoded,
          sha: sha,
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

      // TODO: Delete PR after it's been fixed
      pr.data.state = "closed";
      core.info(pr.data.state);
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
    core.info(pr.data.state);
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
  const regex = /<body>(.*[\s\S]*)<\/body>/gm;
  try {
    const { data } = await axios.get(url);
    const html = cheerio.load(data).html();
    while ((search = regex.exec(html)) !== null) {
      if (search.index === regex.lastIndex) regex.lastIndex++;
      search.forEach((match, groupIndex) => {
        content = match;
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