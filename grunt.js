'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    spritesheet: {
      compile: {
        options: {
          outputImage: 'stylesheets/sprite.png',
          outputCss: 'stylesheets/sprite.css',
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
