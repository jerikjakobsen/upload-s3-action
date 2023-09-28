const core = require('@actions/core');
const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const slash = require('slash').default;
const klawSync = require('klaw-sync');
const { lookup } = require('mime-types');

const AWS_KEY_ID = core.getInput('aws_key_id', {
  required: true,
});
const SECRET_ACCESS_KEY = core.getInput('aws_secret_access_key', {
  required: true,
});
const BUCKET = core.getInput('aws_bucket', {
  required: true,
});
const SOURCE_DIR = core.getInput('source_dir', {
  required: true,
});
const DESTINATION_DIR = core.getInput('destination_dir', {
  required: true,
});
const ENDPOINT = core.getInput('endpoint', {
  required: false,
});

const s3options = {
  accessKeyId: AWS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
};

if (ENDPOINT) {
  s3options.endpoint = ENDPOINT;
}

const s3 = new S3(s3options);

function upload(params) {
  return new Promise((resolve) => {
    s3.upload(params, (err, data) => {
      if (err) core.error(err);
      core.info(`uploaded params Key - ${params.Key}`);
      core.info(`uploaded - ${data.Key}`);
      core.info(`located - ${data.Location}`);
      resolve(data.Location);
    });
  });
}

function run() {
  const sourceDir = slash(path.join(process.cwd(), SOURCE_DIR));
  
  const fileStream = fs.createReadStream(sourceDir);
  const params = {
    Bucket: BUCKET,
    ACL: 'public-read',
    Body: fileStream,
    Key: DESTINATION_DIR,
    ContentType: lookup(sourceDir) || 'text/plain',
  };
  return upload(params);
}

run()
  .then((locations) => {
    core.info(`object key - ${DESTINATION_DIR}`);
    core.info(`object locations - ${locations}`);
    core.setOutput('object_key', DESTINATION_DIR);
    core.setOutput('object_locations', locations);
  })
  .catch((err) => {
    core.error(err);
    core.setFailed(err.message);
  });
