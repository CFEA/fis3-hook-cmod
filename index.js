var path = require('path');
var lookup = require('./lookup.js');
var cmod = require('./cmod.js');
// 程序入口
var entry = module.exports = function(fis, opts) {
  lookup.init(fis, opts);

  // normalize shim
  // 规整 shim 配置。
  opts.shim && (function() {
    var shim = opts.shim;
    var normalized = {};

    Object.keys(shim).forEach(function(key) {
      var val = shim[key];

      if (Array.isArray(val)) {
        val = {
          deps: val
        }
      }

      var info = lookup(fis.util.query(key));
      if (!info.file) {
        return;
      }

      normalized[info.file.subpath] = val;
    });

    opts.shim = normalized;
  })();

  fis.on('lookup:file', lookup);
  fis.on('standard:js', function(info) {
    cmod(info, opts);
  });
  fis.on('components:info', function(componentsInfo) {
    var path = require('path');
    var componentsDir = path.relative(opts.baseUrl || '.', (fis.env().get('component.dir') || 'components/').replace(/\/$/, ''));
    Object.keys(componentsInfo).forEach(function(key) {
      var json = componentsInfo[key];
      opts.packages = opts.packages || [];
      opts.packages.unshift({
        name: json.name,
        main: json.main || 'index',
        location: path.join(componentsDir, json.name)
      });

      if (json.paths) {
        opts.paths = opts.paths || {};
        Object.keys(json.paths).forEach(function(key) {
          opts.paths[path.join(json.name, key)] = path.join(componentsDir, json.name, json.paths[key]);
        });
      }
    });

    lookup.init(fis, opts);
  });

  fis.on('node_modules:info', function (packages) {
      opts.packages = packages.packages

      lookup.init(fis, opts)
  });
  
  // 支持 data-main 的用法。
  var rScript = /<!--([\s\S]*?)(?:-->|$)|(<script[^>]*>[\s\S]*?<\/script>)/ig;
  var rDataMain = /\bdata-main=('|")(.*?)\1/;
  var lang = fis.compile.lang;

  // 解析 data-main
  fis.on('standard:html', function(info) {
    info.content = info.content.replace(rScript, function(all, comment, script) {
      if (!comment && script) {
        all = all.replace(rDataMain, function(_, quote, value) {
          return 'data-main=' + lang.jsAsync.wrap(quote + value + quote);
        });
      }

      return all;
    });
  });
  
  var ignoreDependencies = opts.ignoreDependencies || [];
  if (typeof ignoreDependencies === 'string') {
    ignoreDependencies = ignoreDependencies.split(/\s*,\s*/);
  } else if (!Array.isArray(ignoreDependencies)) {
    ignoreDependencies = [ignoreDependencies];
  }
  opts.ignoreDependencies = ignoreDependencies.map(function(item) {
    return typeof item === 'string' ? fis.util.glob(item, null, {
      matchBase: true,
      nocase: true
    }) : item;
  });
};

entry.defaultOptions = {

  // 是否将全局下面的异步用法，当同步处理。
  // 影响的结果是，依赖会提前在页面里面引入进来，而不是运行时去加载。
  forwardDeclaration: true,

  // 当前置依赖启动的时候才有效，用来控制是否把内建的 `require`, `exports`, `module` 从第二个参数中去掉。
  skipBuiltinModules: true,

  // 用来查找无后缀资源的
  extList: ['.js', '.coffee', '.jsx', '.es6'],

  // 设置包裹时，内容缩进的空格数。
  tab: 4
};
