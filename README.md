# PR Auto Action

A GitHub action to automatically merge PRs that only have one line changed upon comments. This repo was created for [](https://github.com/MLH/mlh-localhost-github)

Checks:
1. Did someone comment? Great, we're running the action.
2. Is there only one line added? Great, we're merging!

Special thanks to [the Frontside Discord community](https://discord.gg/YxWuzm4WR4) for helping me debug and get past a major blocker, especially [minkimcello](https://github.com/minkimcello) and JacobBolda!

## Example Usage
v1.0.0 - Merging a PR with a single addition upon comment
```
name: Check PR can be merged
on:
  issue_comment:
    types: [created]
jobs:
  automerge:
    runs-on: ubuntu-latest
    steps:
      - id: automerge
        name: Automatically Merge PR
        uses: maralihart/pr-auto-action@v1.0.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
v1.1.0 - Considering merge conflicts and adding the addition to the bottom of the file
```
name: Check PR can be merged
on:
  issue_comment:
    types: [created]
jobs:
  automerge:
    runs-on: ubuntu-latest
    steps:
      - id: automerge
        name: Automatically Merge PR
        uses: maralihart/pr-auto-action@v1.1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          filepath: 'test.txt'
          raw-link: 'https://raw.githubusercontent.com/maralihart/test-repo/main/test.txt'
          file-link: 'https://api.github.com/repos/maralihart/test-repo/contents/test.txt'
          email: 'hi@mara.fyi'
```
## Future Expansions
- [ ] Close PRs after merge conflicts work
