'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    min: {
      dist: {
        src: [ 'app/all.js' ],
        dest: 'app/all.js'
      }
    },
    spritesheet: {
      compile: {
        options: {
          outputImage: 'sprite/sprite.png',
          outputCss: 'sprite/sprite.css',
          selector: '.sprite'

        },
        files: {
          'bin': 'app/assets/images/*'
        }
      }
    }
  });

  grunt.loadNpmTasks('node-spritesheet');
  grunt.registerTask('spritegen', 'spritesheet');

  grunt.registerTask('default', function() {
    // noop
  });
};
