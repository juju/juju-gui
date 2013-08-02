'use strict';

/*
 * Configure the CSS sprite generation utility.
 */

module.exports = function(grunt) {
  grunt.initConfig({
    spritesheet: {
      compile: {
        options: {
          outputImage: 'sprites.png',
          outputCss: 'sprites.css',
          selector: '.sprite'

        },
        files: {
          'build-shared/juju-ui/assets': 'app/assets/images/*'
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
