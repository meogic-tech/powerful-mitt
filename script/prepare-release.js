'use strict';

const { exec } = require('child-process-promise');

async function prepare() {
	await exec(`rm -rf npm`)
	await exec(`mkdir npm`)
	await exec(`cp -R dist/* npm`)
	await exec(`cp -R package.json npm`)
	await exec(`cp -R LICENSE npm`)
	await exec(`cp -R README.md npm`)
}
prepare()
