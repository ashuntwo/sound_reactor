module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['tst/**/*.js']
      }
    },
    jshint: {
      options: {
        strict: false,
        esversion: 6,
        predef: [ "-Promise"],
        node: true
      },
      all: [ 'index.js', 'app.js', 'src/**/*.js', 'tst/**/*.js', 'routes/**/*.js' ]
    },
    lambda_invoke: {
        default: {
            options: {
                // Task-specific options go here.
            }
        }
    },
    lambda_package: {
        default: {
          options:{
            include_files: [ 'bin/ffpmeg' ]
          }
        }
    },
    lambda_deploy: {
        default: {
            arn: 'arn:aws:lambda:us-east-1:939027667944:function:sound-reactor',
            options: {
              enableVersioning: true,
              aliases: 'dev'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-aws-lambda');

  // Default task(s).
  grunt.registerTask('default', ['mochaTest', 'jshint']);
  grunt.registerTask('deploy', ['mochaTest', 'jshint', 'lambda_package:default', 'lambda_deploy:default']);
};