# sound_reactor

Sounds Reactor is an AWS lambda function that responds to uploads to an S3 bucket by downloading the file, transcoding it to [ASK audio format](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speech-synthesis-markup-language-ssml-reference#audio), and then uploading it again.

Setting it up is a little tricky, but once set up, it just works.

# AWS Console Setup

1. Create an S3 bucket to store your sound files. We're going to call this BUCKET_NAME throughout.
1. Create an AWS Lambda function with an S3 trigger configured for BUCKET_NAME and Object Created event type.
1. Leave the function body blank, or just the skeleton given and create the function.
1. Note the ARN of the function after creation. We'll call it LAMBDA_ARN throughout.

# Reactor Setup

1. Fork this repo
1. Change the ARN in Gruntfile.js to LAMBDA_ARN.
1. <code>grunt deploy</code>

# Uploading Sounds
1. Upload sounds you want to be converted to a directory within BUCKET_NAME like sounds/incoming/quiet/foo.wav
1. Sound Reactor will convert foo.wav and upload it to sounds/foo.mp3.

# Extra Setup
You can customize how conversion gets run by changing index.js. You can define profiles like loud, quiet, etc, by adding to the <code>parameters</code> map. If you have sound file types you'll be uploading other than .mp3, .aif, and .wav, you can add to the relevant regular expression. 

Or, you could rewrite the whole thing. It's not exactly a paragon of software engineering excellence.