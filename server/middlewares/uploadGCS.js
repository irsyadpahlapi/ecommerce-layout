const Storage = require('@google-cloud/storage');
const config = {
  CLOUD_BUCKET: 'uploadimage.irsyadpahlapi.com',
  PROJECT_ID: 'linear-sight-198008',
}

// prepare storage
const storage = Storage({
  projectId: config.PROJECT_ID,
  keyFilename: "keyfile.json"
});
// console.log(storage, 'ini log ' )
// console.log("keyfile.json",' ini keynya');
// set which bucket
const bucket = storage.bucket(config.CLOUD_BUCKET);

// just a helper to create absolute path to GCS
function getPublicUrl (filename) {
  return `https://storage.googleapis.com/${config.CLOUD_BUCKET}/${filename}`;
}

// the real middleware
function sendUploadToGCS (req, res, next) {
  // console.log(req.file);
  if (!req.file) {
    console.log('fail here uploadGCS line 24')
    return res.status(500).json({message: 'Upload error'})
  }
  const gcsname = Date.now() + '.' + req.file.originalname.split('.').pop();
  const file = bucket.file(gcsname);
  // prepare the stream
  // console.log(gcsname);
  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });
  // handle when upload error
  stream.on('error', (err) => {
    req.file.cloudStorageError = err;
    console.log(err);
    console.log('fail here uploadGCS line 41')
    next(err);
  });

  // handle when upload finish
  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname;
    file.makePublic(). //make the uploaded file public
      then(() => {
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
        console.log('loggg gcp');
        next();
      });
  });

  // write the file
  stream.end(req.file.buffer);
}

module.exports = {
  sendUploadToGCS,
};
