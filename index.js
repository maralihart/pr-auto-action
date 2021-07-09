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

    if (
      !(pr.data.additions < 2 && pr.data.additions - pr.data.deletions === 1)
      || !(pr.data.changed_files === 1)
    ) {
      core.setFailed("Too many lines were changed. PR cannot be merged");
    } else if (pr.data.mergeable_state == "dirty") {
      core.info("Cannot merge PR automatically");

      const contentEncoded = await getNewFile(pr.data.diff_url, raw_link);
      const { data } = await axios.get(apiLink);
      const sha = data.sha;

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
      });

      await octokit.request(`PATCH /repos/${owner}/${repo}/pulls/${prNumber}`, {
        owner: owner,
        repo: repo,
        pull_number: prNumber,
        title: '[AUTOMERGED] ' + pr.data.title,
        state: 'closed'
      });
    } else {
      core.info("PR can be automerged");
      await octokit.rest.pulls.merge({
        owner: owner,
        repo: repo,
        pull_number: prNumber,
        merge_method: "merge"
      });
    }
  } catch (error) {
    core.setFailed(error);
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
    content = content + addition + "\n";
  } catch (error) {
    core.info("Most likely invalid URL");
    core.setFailed(error.message);
  }
  return content
}

async function getNewFile(pr, raw_link) {
  const diffURL = pr.data.diff_url;
  const diff = await getDiff(diffURL);
  const content = await buildFile(raw_link, diff);
  return Base64.encode(content);
}

autoMerge();