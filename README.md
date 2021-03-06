# fis3-hook-cmod

CUI5 采用 CMD 规范作为模块化开发，但修改了部分标准接口；无法使用原fis3-hook-cmd，故做定制修改而得到fis3-hook-cmod以支持产品编译。

请配合 comtop.c5.core.js 一起使用。

注意：
  - 支持data-main属性，开发可以在comtop.c5.core.js脚本上使用data-main属性引入主程序入口。
  - 需要对目标文件设置 `isMod` 属性，说明这些文件是模块化代码。


```js
fis.match('/modules/**.js', {
  isMod: true
})
``` 

只有这样才会被自动包装成 CMD, 如开发已经手工define，则不需要配置此项。

## 安装

全局安装或者本地安装都可以。

```
npm install -g fis3-hook-cmod
```

或者

```
npm install fis3-hook-cmod
```

## 用法

在 fis-conf.js 中加入以下代码。


```js
fis.hook('cmod', {
  // 配置项
});
```

## 配置项

* `baseUrl` 默认为 `.` 即项目根目录。用来配置模块查找根目录。
* `paths` 用来设置别名，路径基于 `baseUrl` 设置。
  
  ```js
  fis.hook('cmod', {
    paths: {
      $: '/modules/jquery/jquery-1.11.2.js'
    }
  });
  ```
* `packages` 用来配置包信息，方便项目中引用。
  
  ```js
  fis.hook('cmod', {
    packages: [
      {
        name: 'foo',
        location: './modules/foo',
        main: 'index.js'
      }
    ]
  });
  ```

  * 当 `require('foo')` 的时候等价于 `require('/modules/foo/index.js')`.
  * 当 `require('foo/a.js')` 的时候，等价于 `require('/modules/foo/a.js')`.
* `shim` 可以达到不改目标文件，指定其依赖和暴露内容的效果。**注意只对不满足cmd的js有效**
  
  ```js
  fis.hook('amd', {
      shim: {
          'comp/2-0/2-0.js': {
              deps: ['jquery'],
              exports: 'myFunc'
          }
      }
  });
  ```
  
  * `key` 为目标文件
  * `value`
    * `deps` [可选] 依赖的 `module` 列表。
    * `exports` [可选] 暴露的对象名称。
    * `init` [可选] 暴露的可以通过自定的方法来控制。
    
  ```js
  fis.hook('cmod', {
      shim: {
          'comp/2-0/2-0.js': {
              deps: ['jquery'],
              init: 'function($) {return $.extend({a: 1}, {b: 2})}'
          }
      }
  });
  ```
* `forwardDeclaration` 默认为 `true`, 用来设置是否开启依赖前置，暂默认开启以方便`combo`，后续根据需求调整。
* `skipBuiltinModules` 默认为 `true`, 只有在 `forwardDeclaration` 启动的时候才有效，用来设置前置依赖列表中是否跳过内置模块如： `require`, `module`, `exports`。
* `extList` 默认为 `['.js', '.coffee', '.jsx', '.es6']`，当引用模块时没有指定后缀，该插件会尝试这些后缀。
* `tab` 默认为 `4`, 用来设置包裹时，内容缩进的空格数。
ignoreDependencies 默认为 空，用来忽略掉对某些资源 require，一般用来忽略掉内部实现的 require 资源。

  ```js
  fis.hook('cmod', {
    // 忽略 angular2 的依赖。我自己负责加载需要资源。
    ignoreDependencies: [
      'angular2/**',
    ]
  });
  ```
