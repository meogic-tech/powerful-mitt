const { exec } = require('child-process-promise');

async function publish() {
	await exec(`cd ./npm && npm publish --access public`);
}

publish()
