var camd = require('./camd.js');
var lang = fis.compile.lang;
var rRequire = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(\/\/[^\r\n\f]+|\/\*[\s\S]+?(?:\*\/|$))|\b(require\.async|C5\.use|require)\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|\[[\s\S]*?\])\s*/g;

var cmod = module.exports = function(info, conf) {
  var file = info.file;
  var shimed = conf.shim && conf.shim[file.subpath];

  // 先进行 amd 解析，基本上一致的，除了 C5.use 和 require.async
  try {
    // 用户主动配置了 shim 那么说明目标文件一定是模块化 js
    shimed && (file.isMod = true);
    camd.apply(camd, arguments);
  } catch(e) {
    fis.log.warn('Got Error: %s while parse [%s].', e.message, file.subpath);
    fis.log.debug(e.stack);
  }

  var content = info.content;

  info.content = content.replace(rRequire, function(m, comment, type, params) {
    if (type) {
      switch (type) {
        case 'require.async':
          var info = parseParams(params);

          m = 'require.async([' + info.params.map(function(v) {
            var type = lang.jsAsync;
            return type.ld + v + type.rd;
          }).join(',') + ']';
          break;

        case 'C5.use':
          var info = parseParams(params);
          var hasBrackets = info.hasBrackets;

          m = 'C5.use(' + (hasBrackets ? '[' : '') + info.params.map(function(v) {
            var type = lang.jsAsync;
            return type.ld + v + type.rd;
          }).join(',') + (hasBrackets ? ']' : '');
          break;

        case 'require':
          var info = parseParams(params);
          var async = info.hasBrackets;

          m = 'require(' + (async ? '[' : '') + info.params.map(function(v) {
            var type = lang[async ? 'jsAsync' : 'jsRequire'];
            return type.ld + v + type.rd;
          }).join(',') + (async ? ']' : '');
          break;
      }
    }

    return m;
  });
};

function parseParams(value) {
  var hasBrackets = false;
  var params = [];

  value = value.trim().replace(/(^\[|\]$)/g, function(m, v) {
    if (v) {
      hasBrackets = true;
    }
    return '';
  });
  params = value.split(/\s*,\s*/);

  return {
    params: params,
    hasBrackets: hasBrackets
  };
}
