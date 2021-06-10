/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 450:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 177:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(450);
const github = __nccwpck_require__(177);

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

    // TODO: take care of merge conflicts?
    if (!mergeable) {
      core.info("can't merge, oop")
    }

    if (onlyOneChangedFile && oneLineAdded) {
      await octokit.rest.pulls.merge({
        owner: owner,
        repo: repo,
        pull_number: prNumber,
        merge_method: "merge"
      });

      core.info("PR successfully merged!");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

autoMerge();
})();

module.exports = __webpack_exports__;
/******/ })()
;