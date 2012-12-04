'use strict';

/*
 * Configure the CSS sprite generation utility.
 */

module.exports = function(grunt) {
  grunt.initConfig({
    spritesheet: {
      compile: {
        options: {
          outputImage: 'sprite.png',
          outputCss: 'sprite.css',
          selector: '.sprite'

        },
        files: {
          'build/juju-ui/assets': 'app/assets/images/*'
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
