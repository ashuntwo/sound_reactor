'use strict';

let aws = require('aws-sdk');
let s3 = new aws.S3({ apiVersion: '2006-03-01' });
let uuid = require('node-uuid');
let fs = require('fs');
let zlib = require('zlib');
let Promise = require('bluebird');
let execAsync = Promise.promisify(require('child_process').exec);

process.env.PATH = process.env.PATH + ':' + process.env.LAMBDA_TASK_ROOT;
const FFMPEG = "ffmpeg";
//const FFMPEG = "/usr/local/bin/ffmpeg";

const parameters = {
	normal: {
		ffmpeg: '-af "volume=15dB"'
	},
	quiet: {
		ffmpeg: '-af "volume=10dB"'
	}
};

const PROFILE_PATTERN = /incoming[/](\w+)[/]/;

exports.handler = function(event, context, done) {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    if(!key.match(/[.](mp3|wav)$/)) {
    	console.log("nothing to do for " + key);
    	done();
    }

    const profile = key.match(PROFILE_PATTERN)[1];
    const inFile = uuid.v1() + "-" + bucket + "-" + key.replace(/[/]/g, '-');
    const inPath = '/tmp/' + inFile;
    const outPath = '/tmp/' + inFile + ".mp3";
    const outKey = key.replace(PROFILE_PATTERN, '').replace(/[.]wav/, '.mp3');

    console.log(`${profile} ${bucket} ${key} ${inFile} ${inPath} ${outPath} ${outKey}`);

    const extraArgs = parameters[profile].ffmpeg || "";

	var file = fs.createWriteStream(inPath);

    const params = {
        Bucket: bucket,
        Key: key
    };
    var stream = s3.getObject(params).createReadStream();
    stream.pipe(file);

    streamToPromise(stream).then(function() {
    	const command = `${FFMPEG} -i ${inPath} -ac 2 -codec:a libmp3lame -b:a 48k -ar 16000 ${extraArgs} ${outPath}`;
    	console.log(`running exec ${command}`);

    	return execAsync(command);

    }).then(function(stdout, stderr) {
    	console.log("finished with exec");

		var s3 = new aws.S3({params: {Bucket: bucket, Key: outKey, ACL: "public-read" }});
		var body = fs.createReadStream(outPath);
		var upload = s3.upload({Body: body});

		Promise.promisifyAll(Object.getPrototypeOf(upload),{ suffix: 'BBAsync' });
		return upload.sendBBAsync();
    }).then(function() {
    	console.log("finished uploading");
    	fs.unlinkSync(inPath);
    	fs.unlinkSync(outPath);
    }).then(_ => done()).catch(done);

    console.log("done with handler");
};

function streamToPromise(stream) {
    return new Promise(function(resolve, reject) {
        stream.on("end", resolve);
        stream.on("error", reject);
    });
}

if(!module.parent) {
	exports.handler({
	  "Records": [
	    {
	      "eventVersion": "2.0",
	      "eventTime": "1970-01-01T00:00:00.000Z",
	      "requestParameters": {
	        "sourceIPAddress": "127.0.0.1"
	      },
	      "s3": {
	        "configurationId": "testConfigRule",
	        "object": {
	          "eTag": "0123456789abcdef0123456789abcdef",
	          "sequencer": "0A1B2C3D4E5F678901",
	          "key": "sounds/incoming/normal/20160611/creek.wav",
	          "size": 1024
	        },
	        "bucket": {
	          "arn": "arn:aws:s3:::mybucket",
	          "name": "magicdoor.huntwork.net",
	          "ownerIdentity": {
	            "principalId": "EXAMPLE"
	          }
	        },
	        "s3SchemaVersion": "1.0"
	      },
	      "responseElements": {
	        "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
	        "x-amz-request-id": "EXAMPLE123456789"
	      },
	      "awsRegion": "us-east-1",
	      "eventName": "ObjectCreated:Put",
	      "userIdentity": {
	        "principalId": "EXAMPLE"
	      },
	      "eventSource": "aws:s3"
	    }
	  ]
	}, null, e => console.log(e ? ("failed " + JSON.stringify(e)): "succeeded"));
}