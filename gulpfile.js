/**
 * TODO: Add Snippets
 * 1.15.21
 *  Added letter-tracking support
 * 9/14/20
 *  Added cache busting for images
 * 9/13/20
 *  Preheader dynamically populates spacers
 * 9/12/20
 *  Moved all settings to config.js file
 *  Private Key path is dynamically added using the user home dir
 *  Added 'antiClip' option which removes a lot of overhead code to avoid clipping on Gmail
 * 9/03/20
 *  Changed naming of files so it is not dependant on the folder it lives in
 *  but on the variable inside the config file
 * 5/23/20
 *  Added brand option
 * 5/22/20
 *  Upload images to SSH
 *  Removed redundant copyHTML
 * 5/15/20
 *  Toggle sidebar tool
 *  jQuery
 * 5/13/20
 *  Added notice messages
 *  Added bottom spacer to tools
 * 5/12/20
 *  Replaced file system with npm file system
 *  Added delete and rename support
 *  Fixed images function
 *  Re-arranged gulp exports
 *  Added gulp watch and gulp browser
 *  fixed cleanName variable

    <!--[if mso]>
      <style>
        sup { vertical-align: 5px; }
        body, td, .ExternalClass *, #backgroundTable, .hide, .preheader{ mso-line-height-rule: exactly; }
        .hide, .preheader{ mso-hide: all; }
        table{
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
      </style>
  <![endif]-->

    <!--[if mso]>
      <style>
          sup {
            vertical-align: 5px;
          }
      </style>
  <![endif]-->
 */

/**
 * Require the gulp components, file system & os for homedir
 */
const { src, dest, watch, series, parallel } = require('gulp');
const fs = require('fs');
const os = require('os');

// initialize a template object
const tpl = {};

// Icons
const icons = {
    success: 'https://docs.google.com/uc?id=1B0HnA713_v0WAS1KQ9ucl_ddqO7ifLhq',
    error:   'https://docs.google.com/uc?id=1hZ_Z_Oxysje_LGBpmStWR0cTySw_bd94',
};

/**
 * selects randomly from an array
 * @param {array} arr
 * @returns {number}
 */
function getRandFromArr(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * This is the only plugin we will require which loads other plugins
 * automatically by using a '$' sign, think of an autoLoader for php classes.
 */
const $ = require('gulp-load-plugins')({ overridePattern: true, pattern: ['gulp-*', 'gulp.*', '@*/gulp{-,.}*', 'browser-*', 'file-*', '*'] });
let conf =  fs.existsSync('config.js') ? require('./config.js') : null;

/**
 * Creat a clean path name
 * @param {String} string Name String
 */
function cleanPath(string) {
    return string.replace(/[^a-z0-9]/gi, '_').toLowerCase() || '';
}

function getEmailFileName() {
    return fs.existsSync(`dev/${cleanPath(conf.emailName)}.html`) ? `${cleanPath(conf.emailName)}.html` : null;
}

/**
 * Get the current folder name and return a clean name to use for our email title and html file
 */
// const cleanName = cleanPath($.path.basename(__dirname));

// reconfigure some settings
if (conf) {
    // if antiClip is on we turn a bunch of stuff off
    if (conf.antiClip) {
        conf = {
            ...conf,
            cleanHtml:        true,
            minifyHTML:       true,
            sassOutputStyle:  'compressed',
            addRoleToTable:   false,
            inlineCssOptions: {
                ...conf.inlineCssOptions,
                removeStyleTags: true,
            },
        };
    }
    // reconfigure upload variables
    if (conf.upload.upload) {
        // if the private key exits use it, otherwise turn uploads off
        if (fs.existsSync(conf.upload.privateKey)) {
            conf.upload.privateKey = fs.readFileSync(conf.upload.privateKey);
            // set up paths
            conf.upload.url = `${conf.upload.url}${cleanPath(conf.brandName)}/${cleanPath(conf.emailName)}/`;
            conf.upload.path = `${conf.upload.path}${cleanPath(conf.brandName)}/${cleanPath(conf.emailName)}/`;
        } else {
            $.notify({ title: '🔑 PEM Key does not exists', message: `Source: ${conf.upload.privateKey || 'empty'}`, icon: icons.error }).write('');
            conf.upload.upload = false;
        }
    }
}

// Tools to include in the page
let tools = '';
// jQUery
tools += '<script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>';
// Letter tracking converter (No longer needed)
// <iframe src="http://waldirb.com/tracking-to-spacing-converter.html" frameborder="0" width="420" height="30%"></iframe>
tools += `
<div id="tools">
    <div class="navBtns" id="btnToggleBorder">Show Borders</div>
    <div class="navBtns" id="btnShare">
        Share<br>
        <button class="btnCopy">Copy</button> <input type="text" readonly>
    </div>
</div>
<span id="btnToggleTools">Tools</span>
`;
// Javascript
tools += `
<script>
    var shareURL = document.location.href.match(/[^\/]+$/)[0];
    var toolsStyles = \`
        #tools { position:fixed;top:0;right: 0; width: 400px; height:100%;background-color: #343a40;display:none; }
        .navBtns { padding: 5px; background: #d3d3d3; cursor: pointer; border-bottom: 1px solid #424242; }
        #btnShare input{ width: 80%; }
        #btnShare button{ width: 15%; }
        #btnToggleTools{ padding: 5px; background: #d3d3d3; margin 5px; position: fixed; right:0; top:0; cursor:pointer; writing-mode:tb }\`;
    var borderStyles = \`
        #backgroundTable, #backgroundTable *{
        box-shadow: 0 0 0 1px #ffffff, 0 0 0 2px #a6534b }\`;
    var borderStyleTag = $('<style>' + borderStyles + '</style>');
    $('#btnToggleTools').on('click', function(){ $('#tools').toggle(); });
    document.body.style.webkitFontSmoothing = 'antialiased';
    $('<style>' + toolsStyles + '</style>').appendTo('head');
    $('#btnToggleBorder').on('click', function(){
        !$(this).hasClass('on') ? borderStyleTag.appendTo('head') : borderStyleTag.remove();
        $(this).toggleClass('on');
    });
    $('#btnShare input').val('${conf.upload.url}/' + shareURL);
    $('.btnCopy').on('click', function() {
        $('#btnShare input').select().focus();
        document.execCommand('copy');
    });
</script>
`;

/**
 * Use browser sync
 */
function bSync() {
    $.browserSync.init({
        injectChanges: false,
        notify:        false,
        ghostMode:     false,
        reloadDelay:   500,
        startPath:     getEmailFileName(),
        server:        {
            baseDir:   'dist',
            directory: true,
        },
        snippetOptions: {
            rule: {
                match: /<\/body>/i,
                fn:    (snippet, match) => tools + snippet + match,
            },
        },
    });
}

function errorHandler() {
    $.notify.onError({ message: '❌ Error: <%= error.message %>', icon: icons.error });
}

function fileUpload(file, dir) {
    $.scp2.defaults(conf.upload);
    $.scp2.mkdir(conf.upload.path, '', () => $.scp2.scp(`${dir}${file}`, conf.upload, (err) => {
        if (err)
            $.notify({ title: '❌ Upload failed:', message: err, icon: icons.error }).write('');
        else
            $.notify({ title: ` ⏫ File "${file}" uploaded:`, message: `${conf.upload.path}${file}`, icon: icons.success }).write('');
    }));
    return true;
}

/**
 * This function will copy all of our images from the development images folder into the
 * distribution images folder and it optimize them if 'tinypng' is true and an api key is present.
 * Only jpg and png files will be optimized.
 * Svg files will be minimized but DO NOT use svg files in emails.
 */
function copyImg() {
    const d = 'dist/img/';
    const s = 'dev/img/';
    return src(`${s}**/*.{png,jpg,jpeg,gif}*`)
        .pipe($.plumber({ errorHandler }))
        .pipe($.debug())
        .pipe($.changed(d))
        .pipe($.if(conf.tinypng && (f => ['.png', '.jpg', '.jpeg'].includes(f.extname)), $.tinypngCompress({ key: getRandFromArr(conf.tinypngKey), sigFile: './.tinypng-sig', summarize: true })))
        .pipe(dest(d))
        .pipe($.notify({ title: 'Images', message: '✅ Task Completed!', icon: icons.success, onLast: true }))
        .pipe($.if(conf.upload.upload, $.through2.obj((file, enc, done) => {
            fileUpload($.path.basename(file.path), d);
            done();
        })));
}

function insertFile(file) {
    if (fs.existsSync(file))
        return fs.readFileSync(file, 'utf8');
    return `<div style="position: fixed; top: 20px; left: 20px; background: #dc3545; color: #fff; padding: 5px 10px; z-index: 9999"><b>${file} -</b> does not exists.</div>`;
}

/**
 * This function compiles our scss files into css files
 * 'sassOutputStyle' will determine the output format
 */
function sassComp() {
    return src('dev/*.scss')
        .pipe($.plumber({ errorHandler }))
        .pipe($.debug())
        .pipe($.sass({ outputStyle: conf.sassOutputStyle }).on('error', $.sass.logError))
        .pipe($.autoprefixer({ cascade: false }))
        .pipe(dest('dev'))
        .pipe($.browserSync.stream())
        .pipe($.notify({ title: 'Sass', message: '✅ Task Completed!', icon: icons.success, onLast: true }));
}

/**
 * This function the following:
 *  Bring all of our css to the head of all the html files and than it inline it on all the elements.
 *  Use our 'attrMap' object to convert css attributes into html attributes that are required for outlook.
 *  Add attributes to tables such as 'cellpadding' and 'cellspacing' if they are not already there, these
 *  Add the presentation roll to tables for screen readers.
 *  Add html4 width and height attributes equivalent to the css.
 *  Add max and min width and height if not present and if conf says to do so
 */
function cssInline() {
    const cssFile = 'dev/style.css';
    const mqFile = 'dev/media-queries.css';
    const version = Math.round(new Date().getTime() / 1000);
    return src('dev/*.html')
        .pipe($.plumber({ errorHandler }))
        .pipe($.debug())
        .pipe($.replace(/<!-- @import css -->/, `<style type="text/css">\n${insertFile(cssFile)}</style>`))
        .pipe($.inlineCss(conf.inlineCssOptions))
        .pipe($.cheerio(($, file, done) => {
            const attrMapKeys = Object.keys(conf.attrMap).join(',');
            // tables and children
            $(attrMapKeys).each((_key, el) => {
                const $el = $(el);
                const elCss = $el.css();
                const tagName = el.name;
                // if its a table add some extra stuff
                if (tagName === 'table') {
                    if (!$el.attr('cellpadding'))
                        $el.attr('cellpadding', 0);
                    if (!$el.attr('cellspacing'))
                        $el.attr('cellspacing', 0);
                    if (!$el.attr('role') && conf.addRoleToTable)
                        $el.attr('role', 'presentation');
                }
                // change images to uploaded path and add version number
                if (tagName === 'img') {
                    const src = $el.attr('src');
                    const imgScr = conf.upload.upload && src.startsWith('img/') ? conf.upload.url + src.replace('img/', '') : $el.attr('src');
                    $el.attr('src', `${imgScr}?v=${version}`);
                }
                // Dynamically add spacers to the preheader
                if ($el.hasClass('preheader')) {
                    // calculate how many empty characters need to be inserted
                    const empty = $el.text().split('').reduce((acc, curr, i) => (i % 2 !== 0 ? acc + 1 : acc), 102) - $el.text().length;
                    // change the preheader text to add the preheader placeholder empty spaces
                    $el.text($el.text() + '{{pre-spacer}}'.repeat(empty < 0 ? 0 : empty));
                }

                // element has css
                if (elCss !== undefined) {
                    // loop through css styles
                    for (const cssProp in elCss) {
                        // safe looping
                        if (elCss.hasOwnProperty(cssProp)) {
                            let cssValue = elCss[cssProp];

                            // letter tracking
                            if (cssProp === 'letter-tracking') {
                                const fontSize = $el.css('font-size') || $el.parent().css('font-size') || $el.parent().parent().css('font-size') || '0';
                                const spacing = cssValue * fontSize.replace('px', '') / 1000;
                                $el.css({ 'letter-spacing': `${spacing}px`, 'letter-tracking': '' });
                            }

                            // if element has a key in attrMap
                            if (conf.attrMap[tagName][cssProp]) {
                                const mapCssProp = conf.attrMap[tagName][cssProp];
                                // spacial mod for width and height (no pixels)
                                if (mapCssProp === 'width' || mapCssProp === 'height')
                                    cssValue = cssValue.replace('px', '');
                                // important breaks attrs so remove it
                                cssValue = cssValue.replace('!important', '').trim();
                                $el.attr(mapCssProp, cssValue); // add all other attrs
                            }
                        }
                    }
                }
            });
            done();
        }))
        .pipe($.if(conf.cleanHtml, $.htmlmin({ collapseWhitespace: conf.minifyHTML })))
        .pipe($.replace(/<!-- @import css-mq -->/, `<style type="text/css">\n${insertFile(mqFile)}</style>`))
        .pipe($.emailRemoveUnusedCss({ whitelist: conf.cssWhiteList }))
        .pipe($.replace('&apos;', '’')) // Apostrophe does not render on Outlook
        .pipe($.replace('{{pre-spacer}}', '&#8203; ')) // replace the preheader place holders // &#8203; / &#x200B;
        .pipe(dest('dist'))
        .pipe($.browserSync.stream())
        .pipe($.notify({ title: 'HTML/Inline Css', message: '✅ Task Completed!', icon: icons.success, onLast: true }))
        .pipe($.if(conf.upload.upload, $.through2.obj((file, enc, done) => {
            fileUpload($.path.basename(file.path), 'dist/');
            done();
        })));
}

/**
* Used to sync deleing and renaming files
* @param {String} action Action taken on the file
* @param {String} path Path of the file
*/
function fileSync(action, path) {
    const devPath = $.path.relative($.path.resolve('dev'), path);
    const destPath = $.path.resolve('dist', devPath);
    if (fs.existsSync(destPath)) {
        if (action === 'unlink')
            fs.unlinkSync(destPath);
        if (action === 'change')
            $.rename(destPath);
    }
}

/**
 * This function creates an email boiler plate with a flat html file, an html
 * named after our 'clean' folder and a Scss file containing all of our css defaults
 * We are prompted a design width which will be populated on the css
 */
function init() {
    const file = {
        flat: 'flat.html',
        conf: 'config.js',
        scss: 'dev/style.scss',
        mq:   'dev/media-queries.scss',
        main: '',
        imgs: 'dev/img',
    };
    const colors = {
        Cosentyx:        ['434343', '5b3161', 'd60c61'],
        Ethicon:         ['434343', 'f30617', '3f969e'],
        Propeller:       ['434343', '1f435b', '6e91cd'],
        Novartis:        ['231f20', 'd60e63', '592d5f'],
        JnJ:             ['434343', 'f30617', '3f969e'],
        'Animal Health': ['424242', 'f30617', '0a8caa'],
        Other:           ['cccccc', '000000', 'ffffff'],
    };
    return src('*.*', { read: false })
        .pipe($.plumber({ errorHandler }))
        .pipe($.prompt.prompt([{
            type:    'list',
            name:    'width',
            message: 'What is the email width in pixels?',
            choices: ['600', '612', '650', '700', '750'],
        }, {
            type:    'list',
            name:    'brand',
            message: 'Select a brand',
            choices: Object.keys(colors),
        }, {
            type:    'list',
            name:    'type',
            message: 'Select Email Type',
            choices: ['HTML', 'OFT'],
        }, {
            type:    'list',
            name:    'upload',
            message: 'Auto-upload to server?',
            choices: ['Yes', 'No'],
        }, {
            type:    'input',
            name:    'name',
            message: 'Please provide a name for this email',
        }], (response) => {
            // update main file name
            file.main = `dev/${getEmailFileName()}`;
            // Extra conf
            if (!fs.existsSync('config.js')) {
                tpl.config = tpl.config.replace('{%brandName%}', response.brand);
                tpl.config = tpl.config.replace('{%emailName%}', response.name);
                tpl.config = tpl.config.replace('{%home_dir%}', os.homedir());
                tpl.config = tpl.config.replace('{%upload%}', response.upload === 'Yes');
                fs.writeFileSync(file.conf, tpl.config);
            }
            // Create dev folder
            if (!fs.existsSync('dev'))
                fs.mkdirSync('dev');
            // Creat flat.html
            if (!fs.existsSync(file.flat))
                fs.writeFileSync(file.flat, tpl.flatHtml.replace('{%d-w%}', response.width));
            // Create scss file
            if (!fs.existsSync(file.scss)) {
                tpl.sass = tpl.sass.replace(/{%d-w%}/g, response.width);
                tpl.sass = tpl.sass.replace('{%color-1%}', colors[response.brand][0]);
                tpl.sass = tpl.sass.replace('{%color-2%}', colors[response.brand][1]);
                tpl.sass = tpl.sass.replace('{%color-3%}', colors[response.brand][2]);
                tpl.sass = tpl.sass.replace('{%emailType%}', response.type === 'HTML' ? 'top' : 'super');
                fs.writeFileSync(file.scss, tpl.sass);
            }
            // Create scss media queries file
            if (!fs.existsSync(file.mq))
                fs.writeFileSync(file.mq, tpl.mediaQueries);
            // Creat main html file
            if (!fs.existsSync(file.main))
                fs.writeFileSync(file.main, tpl.index.replace('{%title%}', response.name));
            // Create images folder
            if (!fs.existsSync(file.imgs))
                fs.mkdirSync(file.imgs);
        }))
        .pipe($.notify({ title: 'Email Initiated', message: '✅ Run gulp again to start coding', icon: icons.success, onLast: true }));
}

exports.compileCode =  series(sassComp, cssInline);
exports.img = conf && conf.upload && conf.upload.upload ? series(copyImg) : copyImg;

/**
 * We watch for changes on html, scss and image files.
 */
function watchMe(done) {
    watch('dev/**/*.{html,scss}', exports.compileCode);
    watch('dev/**/*.{png,jpg,jpeg,gif}', exports.img);
    watch('dev/**/*').on('all', fileSync);
    $.browserSync.reload({ stream: true });
    done();
}

/**
* Exports are used on the command line to start up gulp.
* Use 'gulp init' to start a new email after having ran 'npm install'
* Use 'gulp' to re-open a gulp project. Do not run gulp before first running 'gulp init'
*/
exports.watch = watchMe;
exports.browser = parallel(bSync, watchMe);
exports.init = series(init);
exports.default = conf ? series(exports.compileCode, exports.img, exports.browser) : init;

/**
 * Sass defaults that will be loaded on our Sass file when 'gulp init' is ran.
 */
tpl.sass = `// td { border: 1px solid black !important; }
$c1: #{%color-1%};
$c2: #{%color-2%};
$c3: #{%color-3%};

$colors: (
  1: $c1, 
  2: $c2, 
  3: $c3,
  white: #ffffff,
  black: #000000
);

// Bootstrap colors and background colors
@each $i, $color in $colors{
  .color-#{$i}{ color: #{$color} }
  .bg-#{$i}{ background-color: #{$color} }
}
// vertical aligns
@each $v in (text-top, text-bottom, top, bottom, baseline, middle){ 
    .align-#{$v}{ vertical-align: $v; }
}
// text aligns
@each $v in (center, left, right){ 
    .text-#{$v}{ text-align: $v; } 
}

// Bootstrap line height and font sizes and superscripts
@for $i from 0 through 50 {
  .lh-#{$i}{ line-height: #{$i}px}
  .fs-#{$i}{ font-size: #{$i}px}
  $supSize: ceil($i * 0.62);
  @for $h from 1 through 50 {
      .sup-#{$i}-#{$h} {
        $supLh: ceil($h * 0.8);
        font-size: $supSize+px;
        vertical-align: {%emailType%};
        line-height: $supLh+px;
        // mso-text-raise: 10%;
        // p{ line-height: $supLh+px; margin: 0px; }
        }
    }
}

// extends
%p-0{ padding: 0; } 
%m-0{ margin: 0; }
%w-100{ width: 100%; }
%w-100i{ width: 100% !important; }
%h-100i{ height: 100% !important; }
%mlhr{ mso-line-height-rule: exactly; }
%b-0{ outline: none; border: 0; }

// bootstrap things
.d-w{ width: {%d-w%}px; }
.font-arial{ font-family: Arial, sans-serif;  }
.font-arial-black{ font-weight: 900; font-family: Arial Black, Arial Bold, Gadget, sans-serif;  }
.bold{ font-weight: bold; }
.float-left{ float: left; }
.float-right{ float: right; }
.nowrap{
  word-break: keep-all;
  word-wrap: normal;
  white-space: nowrap;
}

// link color
%linkColor{ color: $c3 !important; }

#outlook a{ @extend %p-0; }

.no-underline{ text-decoration: none; }

// link colors
a, 
a[href], 
.ii a[href], 
.gt a{ @extend %linkColor, .no-underline ; }

// Stops email clients resizing small text. (whished it worked)
body, html{ @extend %p-0, %m-0, %w-100i, %h-100i; }

// normalize font smoothing
body{
  text-size-adjust: 100% !important; 
  font-family: Arial, sans-serif;
}

// backgroundTable
#backgroundTable{ @extend %p-0, %m-0, %w-100i; line-height: 100% !important; background-color: #ffffff; }

// ExternalClass / ReadMsgBody
.ExternalClass, .ReadMsgBody{ @extend %w-100i; }
.ExternalClass *, #backgroundTable{ 
  @extend %mlhr;
  line-height: 100% !important; 
}

.contact a{ 
  color: $c1 !important;
  text-decoration: none !important;
}
a img{ @extend %b-0; }
img{ 
  @extend %b-0, %m-0, %p-0, .lh-0;
  text-decoration: none; 
  -ms-interpolation-mode: bicubic;
  display: block !important;
}

.image_fix{ display: block !important; }
// Yahoo paragraph fix
p{ margin: 1em 0; }

h1, h2, h3, h4, h5, h6, h1 a, h2 a, h3 a, h4 a, h5 a, h6 a{ color: black !important; }
h1 a:active, h2 a:active, h3 a:active, h4 a:active, h5 a:active, h6 a:active{ color: red !important; }
h1 a:visited, h2 a:visited, h3 a:visited, h4 a:visited, h5 a:visited, h6 a:visited{ color: purple !important; }

/* center design
// Centers email on Android 4.4
div[style*="margin: 16px 0"]{ margin: 0 !important; }
// center tables
table{ margin: 0 auto !important; }
*/

// Remove spacing around Outlook 07, 10 tables Bring inline & collapse borders
table{
  @extend %p-0, %m-0, %b-0;
  mso-table-lspace: 0pt; 
  mso-table-rspace: 0pt; 
  border-collapse: collapse;
  border-spacing: 0;
  border: 0;
}
td{ @extend %mlhr, %p-0, %m-0, .font-arial; }

// preheader / hide
.hide, .preheader{ 
  @extend %mlhr;
  background-color: #ffffff !important;
  color: #ffffff !important;
  display: none !important; 
  max-height: 0px !important; 
  overflow: hidden !important;
  visibility: hidden;
  mso-hide: all;
  font-size: 1px;
  line-height: 1px;
  max-width: 0px;
  opacity: 0;
}

// A work-around for email clients meddling in triggered links.
*[x-apple-data-detectors],  /* iOS */
.unstyle-auto-detected-links *,
.aBn{
  border-bottom: 0 !important;
  cursor: default !important;
  color: inherit !important;
  text-decoration: none !important;
  font-size: inherit !important;
  font-family: inherit !important;
  font-weight: inherit !important;
  line-height: inherit !important;
}

// Prevents Gmail from changing the text color in conversation threads.
.im{ color: inherit !important; }

// data detectors
.x-gmail-data-detectors,
.x-gmail-data-detectors *,
.aBn{
    border-bottom: 0 !important;
    cursor: default !important;
}`;

tpl.mediaQueries = `
/*** MOBILE TARGETING ***/
@media only screen and (max-device-width: 480px){
  /* Part one of controlling phone number linking for mobile. */
  a[href^="tel"], a[href^="sms"]{ text-decoration: none; color: inherit; pointer-events: none; cursor: default; }
  .mobile_link a[href^="tel"], .mobile_link a[href^="sms"]{ text-decoration: default; color: inherit !important; pointer-events: auto; cursor: default; }
}
/* More Specific Targeting */
@media only screen and (min-device-width: 768px) and (max-device-width: 1024px){
  /* repeating for the ipad */
  a[href^="tel"], a[href^="sms"]{ text-decoration: none; color: inherit; pointer-events: none; cursor: default; }
  .mobile_link a[href^="tel"], .mobile_link a[href^="sms"]{ text-decoration: default; color: inherit !important; pointer-events: auto; cursor: default; }
}`;

/**
 * Flat file default that is created on 'gulp init'
 */
tpl.flatHtml = `<body style="margin: 0;">
  <img src="flat.png" style="width: {%d-w%}px; margin-bottom: 600px;">
</body>`;

/**
 * HTML file that is created on 'gulp init'
 */
tpl.index = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no">
    <meta name="format-detection" content="date=no">
    <meta name="format-detection" content="address=no">
    <meta name="format-detection" content="email=no">
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->
    <!-- @import css -->
    <!-- @import css-mq -->
    <!--[if mso]>
    <![endif]-->
    <!--[if !mso]><!-->
    <!--<![endif]-->
    <title>{%title%}</title>
</head>
<body>
    <div class="preheader">PREHEADER TEXT</div>
    <!-- Wrapper/Container-->
    <table id="backgroundTable">
        <tr>
            <td>
                <!-- [ [ [ C O N T E N T  B E L O W ] ] ] -->

                <!-- [ [ [ C O N T E N T  A B O V E ] ] ] -->
            </td>
        </tr>
    </table>
    <!-- Wrapper/Container-->
</body>
</html>
`;
tpl.config = `module.exports = {
    /**
     * Brand and Email name
     * Changing these values will change the names of the folder where uploads will happen
     * These names are cleaned up before using them as paths by changing anything that is not a letter or number into an underscore
     * Cosentyx / Oft part 1
     * Example: https://www.propellercommunicates.com/email/cosentyx/oft_part_1/
     */
    brandName:      '{%brandName%}',
    emailName:      '{%emailName%}',
    // Turn this on with very long emails that clip in gmail to dynamically remove an array of elements from the email code.
    antiClip:       false,
    // HTML
    cleanHtml:      true, // HTML clean up
    minifyHTML:     false, // HTMl minify
    addRoleToTable: true, // Makes emails accessible to screen readers
    // Tiny Png
    tinypng:        true,
    tinypngKey:     [
        'Mk1NnP5T4c9M831s1HY865hnRSfrJJHq',
        'wM0FzgNyUZp1abNzK4US7ZBL4rbaH3uk',
        'vC7yJdfSX5sWHyMBLRd1pw8xvvVW7dn1',
        'NyKt7b0LP8h4ltQ1t2hjY7rlVhGydr3m',
    ],
    // Upload images dynamically, if no key is found, upload is skipped
    upload: {
        upload:     {%upload%},
        url:        'https://www.propellercommunicates.com/email/',
        host:       '34.227.131.179',
        port:       22,
        username:   'ubuntu',
        path:       '/var/www/sites/email/',
        privateKey: '{%home_dir%}/.ssh/PROPELLER_CORP.pem',
    },
    sassOutputStyle:  'compact', // nested, compact, expanded, compressed
    // Change inline Css options
    inlineCssOptions: {
        removeStyleTags:      false,
        removeLinkTags:       false,
        preserveMediaQueries: true,
    },
    // Do not remove these classes/ids on clean up
    cssWhiteList: [
        '.ExternalClass *',
        '.ReadMsgBody',
        '.yshortcuts',
        '.Mso*',
        '.maxwidth-apple-mail-fix',
        '#outlook',
        '.aBn',
        '*[x-apple-data-detectors]',
        '.unstyle-auto-detected-links *',
        '.x-gmail-data-detectors',
        '.x-gmail-data-detectors *',
        '.ii a[href]',
        '.ii',
        '.gt',
    ],
    // css attributes to turn into html attributes
    attrMap: {
        table: {
            'background-color': 'bgcolor',
            float:              'align',
            width:              'width',
            height:             'height',
            border:             'border',
        },
        tr: {
            'background-color': 'bgcolor',
        },
        td: {
            'background-color': 'bgcolor',
            width:              'width',
            height:             'height',
            'vertical-align':   'valign',
            'text-align':       'align',
            'white-space':      'nowrap',
        },
        font: {
            'font-family': 'face',
            color:         'color',
        },
        img: {
            'vertical-align': 'align',
            float:            'align',
            border:           'border',
            width:            'width',
            height:           'height',
        },
        div: {
            'text-align': 'align',
        },
        span: {},
    },
};
`;
