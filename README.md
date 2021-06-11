# PR Auto Action

A GitHub action to automatically merge PRs that only have one line changed upon comments. This repo was created for [](https://github.com/MLH/mlh-localhost-github)

Checks:
1. Did someone comment? Great, we're running the action.
2. Is there only one line added? Great, we're merging!

Special thanks to [the Frontside Discord community](https://discord.gg/YxWuzm4WR4) for helping me debug and get past a major blocker, especially [minkimcello](https://github.com/minkimcello) and JacobBolda!

## Example Usage
v0.29 - Merging a PR with a single addition upon comment
```
name: Check PR can be merged
on:
  issue_comment:
    types: [created]
jobs:
  run_actions:
    runs-on: ubuntu-latest
    steps:
      - name: Automatically Merge PR
        uses: maralihart/pr-auto-action@v0.29
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

Not Yet Implemented
```
name: Check PR can be merged
on:
  issue_comment:
    types: [created]
jobs:
  run_actions:
    runs-on: ubuntu-latest
    steps:
      - name: Automatically Merge PR
        uses: maralihart/pr-auto-action@v0.48
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }},
          filepath: './test.txt',
          raw_link: 'https://raw.githubusercontent.com/maralihart/test-repo/main/test.txt',
          email: 'hi@mara.fyi'
```
