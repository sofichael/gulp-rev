'use strict';
var gulp = require('gulp');
/*global -$ 加载需使用的gulp插件*/
var $ = require('gulp-load-plugins')();

/*
  *管理资源文件路径集合
  *config.static下
  *css scripts images 替换为自己的路径(可按照此配置管理)
 */
var config = {};
// 源资源文件路径
config['static'] = {
    styles: 'static/styles/*.*',
    scripts: 'static/scripts/*.*',
    images: 'static/images/*.*',
    html:'static/*.html'
};

// 过渡文件路径
config['rev'] = {
    styles: 'rev/styles/',
    styles_file: 'rev/styles/*.*',
    scripts: 'rev/scripts/',
    scripts_file: 'rev/scripts/*.*',
    images: 'rev/images/',
    images_file: 'rev/images/*.*',
    html:'rev/'
};

// 目标文件路径　不用替换
config['dist'] = {
    styles: 'dist/styles/',
    scripts: 'dist/scripts/',
    images: 'dist/images/',
    html:'dist/'
};

/*
 *images 任务流
 */
gulp.task('images', function () {
    return gulp.src(config['static'].images)
        .on('error', function (err) {
            console.error('Error!', err.message);
         })
        .pipe($.imagemin({
            distgressive: true,
            progressive: true,
            interlaced: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [require('imagemin-pngquant')()]
        }))
        .pipe(gulp.dest(config['rev'].images))
        .pipe($.notify({ message: 'images task complete' }));
});

/*
 *scss 任务流
 */
gulp.task('scss', function () {
  return gulp.src(config['static'].styles)
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'nested', // libsass doesn't support expanded yet
      precision: 10,
      includePaths: ['.'],
      onError: console.error.bind(console, 'Sass error:')
    }))
    .pipe($.sourcemaps.write())
    .pipe($.minifyCss())
    .pipe($.concat('app.css'))
    .pipe(gulp.dest(config['rev'].styles))
    .pipe($.notify({ message: 'scss task complete'}));
});

/*
 *jshint 任务流
 */
gulp.task('jshint', function () {
      return gulp.src(config['static'].scripts)
            .pipe($.jshint())
            .pipe($.concat('app.js'))
            .pipe($.uglify({mangle:true}))
            .pipe(gulp.dest(config['rev'].scripts))
            .pipe($.notify({ message: 'jshint service controller task complete'}));
});

/*
 *img 添加版本任务流
 *use gulp-rev to version the rev files and generate the 'rev-manifest.json' file
 */
gulp.task('img', ['images'], function(){
    return gulp.src(config['rev'].images_file)
        .pipe($.rev())
        .pipe(gulp.dest(config['dist'].images))
        .pipe($.rev.manifest({
            base: 'dist',
            merge: true //如果存在 rev-manifest.json文件则合并
        }))
        .pipe(gulp.dest('dist'));
});

/*
 *css 添加版本任务流
 *use gulp-rev to version the rev files and merge the 'rev-manifest.json' file
 */
gulp.task('css', ['scss'], function(){
    return gulp.src(config['rev'].styles_file)
        .pipe($.rev())
        .pipe(gulp.dest(config['dist'].styles))
        .pipe($.rev.manifest({
            base: 'dist',
            merge: true
        }))
        .pipe(gulp.dest('dist'));
});

/*
 *js 添加版本任务流
 *use gulp-rev to version the rev files and merge the 'rev-manifest.json' file
 */
gulp.task('js', ['jshint'], function(){
    return gulp.src(config['rev'].scripts_file)
        .pipe($.rev())
        .pipe(gulp.dest(config['dist'].scripts))
        .pipe($.rev.manifest({
            base: 'dist',
            merge: true
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('rev',['img','css','js'], function () {
    gulp.src(['rev-manifest.json', config['static'].html])
        .pipe( $.revCollector({
            replaceReved: true,
            dirReplacements: {
                //路径替换
                // 'css': '/dist/css',
                // '/js/': '/dist/js/',
                // 'cdn/': function(manifest_value) {
                //     return '//cdn' + (Math.floor(Math.random() * 9) + 1) + '.' + 'exsample.dot' + '/img/' + manifest_value;
                // }
            }
        }) )
        .pipe($.minifyHtml({conditionals: true, loose: true}))
        .pipe(gulp.dest('dist'));
    gulp.task('del', require('del')('rev'));//最后删除过渡文件目录
});


gulp.task('clean', require('del').bind(null, ['dist','rev']));

gulp.task('test', ['clean'], function () {
  gulp.start('rev');
});
