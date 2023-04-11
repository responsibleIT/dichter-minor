const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");
const leec = require("gulp-line-ending-corrector");
const concat = require("gulp-concat");
const sourceMaps = require("gulp-sourcemaps");

const paths = {
  styles: {
    src: "./src/scss/screen.scss",
    dest: "./public/css",
  },
};

return gulp
  .src(paths.styles.src)
  .pipe(sass({ includePaths: ["node_modules/microscope-sass/lib"] }))
  .pipe(concat("all.css"))
  .pipe(
    autoprefixer({
      cascade: false,
    })
  )
  .pipe(
    sourceMaps.init({
      loadMaps: true,
      largeFile: true,
    })
  )
  .pipe(cleanCSS())
  .pipe(sourceMaps.write("./maps/"))
  .pipe(leec())
  .pipe(gulp.dest(paths.styles.dest));
