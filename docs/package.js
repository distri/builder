(function(pkg) {
  // Expose a require for our package so scripts can access our modules
  window.require = Require.generateFor(pkg);
})({
  "version": "0.1.0",
  "source": {
    "LICENSE": {
      "path": "LICENSE",
      "mode": "100644",
      "content": "The MIT License (MIT)\n\nCopyright (c) 2013 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
      "type": "blob"
    },
    "README.md": {
      "path": "README.md",
      "mode": "100644",
      "content": "builder\n=======\n\nA builder for distri apps.\n",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "mode": "100644",
      "content": "Builder\n=======\n\nThe builder knows how to compile a source tree or individual files into various\nbuild products.\n\nThis should be extracted to a separate library eventually.\n\nDependencies\n------------\n\nThis guy helps package our app and manage dependencies.\n\n    Packager = require \"packager\"\n\nHelpers\n-------\n\n    readSourceConfig = (pkg=PACKAGE) ->\n      if configData = pkg.source[\"pixie.cson\"]?.content\n        CSON.parse(configData)\n      else if configData = pkg.source[\"pixie.json\"]?.content\n        JSON.parse(configData)\n      else\n        {}\n\n    arrayToHash = (array) ->\n      array.reduce (hash, file) ->\n        hash[file.path] = file\n        hash\n      , {}\n\n`stripMarkdown` converts a literate file into pure code for compilation or execution.\n\n    stripMarkdown = (content) ->\n      content.split(\"\\n\").map (line) ->\n        if match = (/^([ ]{4}|\\t)/).exec line\n          line[match[0].length..]\n        else\n          \"\"\n      .join(\"\\n\")\n\n`compileTemplate` compiles a haml file into a HAMLjr program.\n\n    compileTemplate = (source) ->\n      \"\"\"\n        module.exports = Function(\"return \" + HAMLjr.compile(#{JSON.stringify(source)}, {compiler: CoffeeScript}))()\n      \"\"\"\n\n`stringData` exports a string of text. When you require a file that exports\nstring data it returns the string for you to use in your code. This is handy for\nCSS or other textually based data.\n\n    stringData = (source) ->\n      \"module.exports = #{JSON.stringify(source)};\"\n\n`compileStyl` compiles a styl file into CSS and makes it available as a string\nexport.\n\n    compileStyl = (source) ->\n      styleContent = styl(source, whitespace: true).toString()\n\n      stringData(styleContent)\n\n`compileCoffee` compiles a coffee file into JS and adds the sourceURL comment.\n\nTODO: Work with the require component to make the sourceURL unique for files in\nmodules.\n\n    compileCoffee = (source, path) ->\n      \"\"\"\n        #{CoffeeScript.compile(source)}\n        //# sourceURL=#{path}\n      \"\"\"\n\n`compileFile` take a fileData and returns a buildData. A buildData has a `path`,\nand properties for what type of content was built.\n\nTODO: Allow for files to generate docs and code at the same time.\n\n    compileFile = ({path, content}) ->\n      [name, extension] = [path.withoutExtension(), path.extension()]\n\n      result =\n        switch extension\n          when \"js\"\n            code: content\n          when \"json\"\n            code: stringData(JSON.parse(content))\n          when \"cson\"\n            code: stringData(CSON.parse(content))\n          when \"coffee\"\n            code: compileCoffee(content, path)\n          when \"haml\"\n            code: compileTemplate(content, name)\n          when \"styl\"\n            code: compileStyl(content)\n          when \"css\"\n            code: stringData(content)\n          when \"md\"\n            # Separate out code and call compile again\n            compileFile\n              path: name\n              content: stripMarkdown(content)\n          else\n            {}\n\n      Object.defaults result,\n        name: name\n        extension: extension\n\n      Object.extend result,\n        path: path\n\nBuilder\n-------\n\nThe builder instance.\n\nTODO: Extract this whole duder to a separate component.\n\nTODO: Standardize interface to use promises.\n\nTODO: Allow configuration of builder instances, adding additional compilers,\npostprocessors, etc.\n\n    Builder = ->\n      build = (fileData) ->\n        results = fileData.map ({path, content}) ->\n          try\n            # TODO: Separate out tests\n\n            compileFile\n              path: path\n              content: content\n          catch {location, message}\n            if location?\n              message = \"Error on line #{location.first_line + 1}: #{message}\"\n\n            error: \"#{path} - #{message}\"\n\n        [errors, data] = results.partition (result) -> result.error\n\n        if errors.length\n          Deferred().reject(errors.map (e) -> e.error)\n        else\n          Deferred().resolve(data)\n\nPost processors operate on the built package.\n\nTODO: Maybe we should split post processors into the packager.\n\n      postProcessors = []\n\n      addPostProcessor: (fn) ->\n        postProcessors.push fn\n\nCompile and build a tree of file data into a distribution. The distribution should\ninclude source files, compiled files, and documentation.\n\n      build: (fileData, cache={}) ->\n        build(fileData)\n        .then (items) ->\n          results = []\n\n          items.eachWithObject results, (item, hash) ->\n            if item.code\n              results.push item\n            else\n              # Do nothing, we don't know about this item\n\n          results = results.map (item) ->\n            path: item.name\n            content: item.code\n            type: \"blob\"\n\n          # TODO: We should be able to put a lot of this into postProcessors\n\n          source = arrayToHash(fileData)\n\n          config = readSourceConfig(source: source)\n\n          # TODO: Robustify bundled dependencies\n          # Right now we're always loading them from remote urls during the\n          # build step. The default http caching is probably fine to speed this\n          # up, but we may want to look into keeping our own cache during dev\n          # in addition to using the package's existing dependencies rather\n          # than always updating\n          dependencies = config.dependencies or {}\n\n          Packager.collectDependencies(dependencies, cache)\n          .then (bundledDependencies) ->\n            postProcessors.pipeline\n              version: config.version\n              source: source\n              distribution: arrayToHash(results)\n              entryPoint: config.entryPoint or \"main\"\n              dependencies: bundledDependencies\n              remoteDependencies: config.remoteDependencies\n\n    module.exports = Builder\n",
      "type": "blob"
    },
    "TODO": {
      "path": "TODO",
      "mode": "100644",
      "content": "\n\nMove adding dependencies to a post processor.\nMove adding version to a post processor.\nMove adding remote dependencies to post processor.\n\nPipes instead of deferred for post processors.\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.1.0\"\nentryPoint: \"main\"\ndependencies:\n  packager: \"STRd6/packager:v0.4.1\"\n",
      "type": "blob"
    },
    "test/builder.coffee": {
      "path": "test/builder.coffee",
      "mode": "100644",
      "content": "global.require = require\nglobal.PACKAGE = PACKAGE\n\nBuilder = require \"../main\"\n\ndescribe \"Builder\", ->\n  it \"should exist\", ->\n    assert Builder\n",
      "type": "blob"
    }
  },
  "distribution": {
    "main": {
      "path": "main",
      "content": "(function() {\n  var Builder, Packager, arrayToHash, compileCoffee, compileFile, compileStyl, compileTemplate, readSourceConfig, stringData, stripMarkdown;\n\n  Packager = require(\"packager\");\n\n  readSourceConfig = function(pkg) {\n    var configData, _ref, _ref1;\n    if (pkg == null) {\n      pkg = PACKAGE;\n    }\n    if (configData = (_ref = pkg.source[\"pixie.cson\"]) != null ? _ref.content : void 0) {\n      return CSON.parse(configData);\n    } else if (configData = (_ref1 = pkg.source[\"pixie.json\"]) != null ? _ref1.content : void 0) {\n      return JSON.parse(configData);\n    } else {\n      return {};\n    }\n  };\n\n  arrayToHash = function(array) {\n    return array.reduce(function(hash, file) {\n      hash[file.path] = file;\n      return hash;\n    }, {});\n  };\n\n  stripMarkdown = function(content) {\n    return content.split(\"\\n\").map(function(line) {\n      var match;\n      if (match = /^([ ]{4}|\\t)/.exec(line)) {\n        return line.slice(match[0].length);\n      } else {\n        return \"\";\n      }\n    }).join(\"\\n\");\n  };\n\n  compileTemplate = function(source) {\n    return \"module.exports = Function(\\\"return \\\" + HAMLjr.compile(\" + (JSON.stringify(source)) + \", {compiler: CoffeeScript}))()\";\n  };\n\n  stringData = function(source) {\n    return \"module.exports = \" + (JSON.stringify(source)) + \";\";\n  };\n\n  compileStyl = function(source) {\n    var styleContent;\n    styleContent = styl(source, {\n      whitespace: true\n    }).toString();\n    return stringData(styleContent);\n  };\n\n  compileCoffee = function(source, path) {\n    return \"\" + (CoffeeScript.compile(source)) + \"\\n//# sourceURL=\" + path;\n  };\n\n  compileFile = function(_arg) {\n    var content, extension, name, path, result, _ref;\n    path = _arg.path, content = _arg.content;\n    _ref = [path.withoutExtension(), path.extension()], name = _ref[0], extension = _ref[1];\n    result = (function() {\n      switch (extension) {\n        case \"js\":\n          return {\n            code: content\n          };\n        case \"json\":\n          return {\n            code: stringData(JSON.parse(content))\n          };\n        case \"cson\":\n          return {\n            code: stringData(CSON.parse(content))\n          };\n        case \"coffee\":\n          return {\n            code: compileCoffee(content, path)\n          };\n        case \"haml\":\n          return {\n            code: compileTemplate(content, name)\n          };\n        case \"styl\":\n          return {\n            code: compileStyl(content)\n          };\n        case \"css\":\n          return {\n            code: stringData(content)\n          };\n        case \"md\":\n          return compileFile({\n            path: name,\n            content: stripMarkdown(content)\n          });\n        default:\n          return {};\n      }\n    })();\n    Object.defaults(result, {\n      name: name,\n      extension: extension\n    });\n    return Object.extend(result, {\n      path: path\n    });\n  };\n\n  Builder = function() {\n    var build, postProcessors;\n    build = function(fileData) {\n      var data, errors, results, _ref;\n      results = fileData.map(function(_arg) {\n        var content, location, message, path;\n        path = _arg.path, content = _arg.content;\n        try {\n          return compileFile({\n            path: path,\n            content: content\n          });\n        } catch (_error) {\n          location = _error.location, message = _error.message;\n          if (location != null) {\n            message = \"Error on line \" + (location.first_line + 1) + \": \" + message;\n          }\n          return {\n            error: \"\" + path + \" - \" + message\n          };\n        }\n      });\n      _ref = results.partition(function(result) {\n        return result.error;\n      }), errors = _ref[0], data = _ref[1];\n      if (errors.length) {\n        return Deferred().reject(errors.map(function(e) {\n          return e.error;\n        }));\n      } else {\n        return Deferred().resolve(data);\n      }\n    };\n    postProcessors = [];\n    return {\n      addPostProcessor: function(fn) {\n        return postProcessors.push(fn);\n      },\n      build: function(fileData, cache) {\n        if (cache == null) {\n          cache = {};\n        }\n        return build(fileData).then(function(items) {\n          var config, dependencies, results, source;\n          results = [];\n          items.eachWithObject(results, function(item, hash) {\n            if (item.code) {\n              return results.push(item);\n            } else {\n\n            }\n          });\n          results = results.map(function(item) {\n            return {\n              path: item.name,\n              content: item.code,\n              type: \"blob\"\n            };\n          });\n          source = arrayToHash(fileData);\n          config = readSourceConfig({\n            source: source\n          });\n          dependencies = config.dependencies || {};\n          return Packager.collectDependencies(dependencies, cache).then(function(bundledDependencies) {\n            return postProcessors.pipeline({\n              version: config.version,\n              source: source,\n              distribution: arrayToHash(results),\n              entryPoint: config.entryPoint || \"main\",\n              dependencies: bundledDependencies,\n              remoteDependencies: config.remoteDependencies\n            });\n          });\n        });\n      }\n    };\n  };\n\n  module.exports = Builder;\n\n}).call(this);\n\n//# sourceURL=main.coffee",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.1.0\",\"entryPoint\":\"main\",\"dependencies\":{\"packager\":\"STRd6/packager:v0.4.1\"}};",
      "type": "blob"
    },
    "test/builder": {
      "path": "test/builder",
      "content": "(function() {\n  var Builder;\n\n  global.require = require;\n\n  global.PACKAGE = PACKAGE;\n\n  Builder = require(\"../main\");\n\n  describe(\"Builder\", function() {\n    return it(\"should exist\", function() {\n      return assert(Builder);\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/builder.coffee",
      "type": "blob"
    }
  },
  "entryPoint": "main",
  "dependencies": {
    "packager": {
      "version": "0.4.1",
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "packager\n========\n\nCreate standalone build products for web packages\n",
          "type": "blob"
        },
        "packager.coffee.md": {
          "path": "packager.coffee.md",
          "mode": "100644",
          "content": "Packager\n========\n\nThe main responsibilities will be bundling dependencies, and creating the\npackage.\n\n    Packager =\n\nIf our string is an absolute URL then we assume that the server is CORS enabled\nand we can make a cross origin request to collect the JSON data.\n\nWe also handle a Github repo dependency. Something like `STRd6/issues:master`.\nThis uses JSONP to load the package from the gh-pages branch of the given repo.\n\n`STRd6/issues:master` will be accessible at `http://strd6.github.io/issues/master.jsonp`.\nThe callback is the same as the repo info string: `window[\"STRd6/issues:master\"](... DATA ...)`\n\nWhy all the madness? Github pages doesn't allow CORS right now, so we need to use\nthe JSONP hack to work around it. Because the files are static we can't allow the\nserver to generate a wrapper in response to our query string param so we need to\nwork out a unique one per file ahead of time. The `<user>/<repo>:<ref>` string is\nunique for all our packages so we use it to determine the URL and name callback.\n\n      collectDependencies: (dependencies, cachedDependencies={}) ->\n        names = Object.keys(dependencies)\n\n        Deferred.when(names.map (name) ->\n          value = dependencies[name]\n\n          if typeof value is \"string\"\n            if value.startsWith(\"http\")\n              $.getJSON(value)\n            else\n              if (match = value.match(/([^\\/]*)\\/([^\\:]*)\\:(.*)/))\n                [callback, user, repo, branch] = match\n\n                if cachedDependency = lookupCached(cachedDependencies, \"#{user}/#{repo}\", branch)\n                  [cachedDependency]\n                else\n                  $.ajax\n                    url: \"http://#{user}.github.io/#{repo}/#{branch}.jsonp\"\n                    dataType: \"jsonp\"\n                    jsonpCallback: callback\n                    cache: true\n              else\n                reject \"\"\"\n                  Failed to parse repository info string #{value}, be sure it's in the\n                  form `<user>/<repo>:<ref>` for example: `STRd6/issues:master`\n                  or `STRd6/editor:v0.9.1`\n                \"\"\"\n          else\n            reject \"Can only handle url string dependencies right now\"\n        ).then (results) ->\n          bundledDependencies = {}\n\n          names.each (name, i) ->\n            bundledDependencies[name] = results[i].first()\n\n          return bundledDependencies\n\nCreate the standalone components of this package. An html page that loads the\nmain entry point for demonstration purposes and a json package that can be\nused as a dependency in other packages.\n\nThe html page is named `index.html` and is in the folder of the ref, or the root\nif our ref is the default branch.\n\nDocs are generated and placed in `docs` directory as a sibling to `index.html`.\n\nAn application manifest is served up as a sibling to `index.html` as well.\n\nThe `.js`, `.json`, and `.jsonp` build products are placed into the root level,\nas siblings to the folder containing `index.html`. If this branch is the default\nthen these build products are placed as siblings to `index.html`\n\nThe optional second argument is an array of files to be added to the final\npackage.\n\n      standAlone: (pkg, files=[]) ->\n        repository = pkg.repository\n        branch = repository.branch\n\n        if branch is repository.default_branch\n          base = \"\"\n        else\n          base = \"#{branch}/\"\n\n        add = (path, content) ->\n          files.push\n            path: path\n            content: content\n\n        add \"#{base}index.html\", html(pkg)\n        add \"#{base}manifest.appcache\", cacheManifest(pkg)\n\n        json = JSON.stringify(pkg, null, 2)\n\n        add \"#{branch}.jsonp\", jsonpWrapper(repository, json)\n\n        return files\n\nGenerates a standalone page for testing the app.\n\n      testScripts: (pkg) ->\n        {distribution} = pkg\n\n        testProgram = Object.keys(distribution).select (path) ->\n          path.match /test\\//\n        .map (testPath) ->\n          \"require('./#{testPath}')\"\n        .join \"\\n\"\n\n        \"\"\"\n          #{dependencyScripts(pkg.remoteDependencies)}\n          <script>\n            #{packageWrapper(pkg, testProgram)}\n          <\\/script>\n        \"\"\"\n\n    module.exports = Packager\n\nHelpers\n-------\n\nCreate a rejected deferred with the given message.\n\n    reject = (message) ->\n      Deferred().reject(message)\n\nA standalone html page for a package.\n\n    html = (pkg) ->\n      \"\"\"\n        <!DOCTYPE html>\n        <html manifest=\"manifest.appcache?#{+new Date}\">\n        <head>\n        <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n        #{dependencyScripts(pkg.remoteDependencies)}\n        </head>\n        <body>\n        <script>\n        #{packageWrapper(pkg, \"require('./#{pkg.entryPoint}')\")}\n        <\\/script>\n        </body>\n        </html>\n      \"\"\"\n\nAn HTML5 cache manifest for a package.\n\n    cacheManifest = (pkg) ->\n      \"\"\"\n        CACHE MANIFEST\n        # #{+ new Date}\n\n        CACHE:\n        index.html\n        #{(pkg.remoteDependencies or []).join(\"\\n\")}\n\n        NETWORK:\n        https://*\n        http://*\n        *\n      \"\"\"\n\n`makeScript` returns a string representation of a script tag that has a src\nattribute.\n\n    makeScript = (src) ->\n      script = document.createElement(\"script\")\n      script.src = src\n\n      return script.outerHTML\n\n`dependencyScripts` returns a string containing the script tags that are\nthe remote script dependencies of this build.\n\n    dependencyScripts = (remoteDependencies=[]) ->\n      remoteDependencies.map(makeScript).join(\"\\n\")\n\nWraps the given data in a JSONP function wrapper. This allows us to host our\npackages on Github pages and get around any same origin issues by using JSONP.\n\n    jsonpWrapper = (repository, data) ->\n      \"\"\"\n        window[\"#{repository.full_name}:#{repository.branch}\"](#{data});\n      \"\"\"\n\nWrap code in a closure that provides the package and a require function. This\ncan be used for generating standalone HTML pages, scripts, and tests.\n\n    packageWrapper = (pkg, code) ->\n      \"\"\"\n        ;(function(PACKAGE) {\n        var oldRequire = window.Require;\n        #{PACKAGE.dependencies.require.distribution.main.content}\n        var require = Require.generateFor(PACKAGE);\n        window.Require = oldRequire;\n        #{code}\n        })(#{JSON.stringify(pkg, null, 2)});\n      \"\"\"\n\nLookup a package from a cached list of packages.\n\n    lookupCached = (cache, fullName, branch) ->\n      name = Object.keys(cache).select (key) ->\n        repository = cache[key].repository\n\n        repository.full_name is fullName and repository.branch is branch\n      .first()\n\n      if name\n        cache[name]\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.4.1\"\nentryPoint: \"packager\"\nremoteDependencies: [\n  \"//code.jquery.com/jquery-1.10.1.min.js\"\n  \"http://strd6.github.io/tempest/javascripts/envweb.js\"\n]\ndependencies:\n  require: \"STRd6/require:v0.2.2\"\n",
          "type": "blob"
        },
        "test/packager.coffee": {
          "path": "test/packager.coffee",
          "mode": "100644",
          "content": "Packager = require(\"../packager\")\n\ndescribe \"Packager\", ->\n  it \"should exist\", ->\n    assert Packager\n\n  it \"should be able to create a standalone html page\", ->\n    assert Packager.standAlone(PACKAGE)\n",
          "type": "blob"
        }
      },
      "distribution": {
        "packager": {
          "path": "packager",
          "content": "(function() {\n  var Packager, cacheManifest, dependencyScripts, html, jsonpWrapper, lookupCached, makeScript, packageWrapper, reject;\n\n  Packager = {\n    collectDependencies: function(dependencies, cachedDependencies) {\n      var names;\n      if (cachedDependencies == null) {\n        cachedDependencies = {};\n      }\n      names = Object.keys(dependencies);\n      return Deferred.when(names.map(function(name) {\n        var branch, cachedDependency, callback, match, repo, user, value;\n        value = dependencies[name];\n        if (typeof value === \"string\") {\n          if (value.startsWith(\"http\")) {\n            return $.getJSON(value);\n          } else {\n            if ((match = value.match(/([^\\/]*)\\/([^\\:]*)\\:(.*)/))) {\n              callback = match[0], user = match[1], repo = match[2], branch = match[3];\n              if (cachedDependency = lookupCached(cachedDependencies, \"\" + user + \"/\" + repo, branch)) {\n                return [cachedDependency];\n              } else {\n                return $.ajax({\n                  url: \"http://\" + user + \".github.io/\" + repo + \"/\" + branch + \".jsonp\",\n                  dataType: \"jsonp\",\n                  jsonpCallback: callback,\n                  cache: true\n                });\n              }\n            } else {\n              return reject(\"Failed to parse repository info string \" + value + \", be sure it's in the\\nform `<user>/<repo>:<ref>` for example: `STRd6/issues:master`\\nor `STRd6/editor:v0.9.1`\");\n            }\n          }\n        } else {\n          return reject(\"Can only handle url string dependencies right now\");\n        }\n      })).then(function(results) {\n        var bundledDependencies;\n        bundledDependencies = {};\n        names.each(function(name, i) {\n          return bundledDependencies[name] = results[i].first();\n        });\n        return bundledDependencies;\n      });\n    },\n    standAlone: function(pkg, files) {\n      var add, base, branch, json, repository;\n      if (files == null) {\n        files = [];\n      }\n      repository = pkg.repository;\n      branch = repository.branch;\n      if (branch === repository.default_branch) {\n        base = \"\";\n      } else {\n        base = \"\" + branch + \"/\";\n      }\n      add = function(path, content) {\n        return files.push({\n          path: path,\n          content: content\n        });\n      };\n      add(\"\" + base + \"index.html\", html(pkg));\n      add(\"\" + base + \"manifest.appcache\", cacheManifest(pkg));\n      json = JSON.stringify(pkg, null, 2);\n      add(\"\" + branch + \".jsonp\", jsonpWrapper(repository, json));\n      return files;\n    },\n    testScripts: function(pkg) {\n      var distribution, testProgram;\n      distribution = pkg.distribution;\n      testProgram = Object.keys(distribution).select(function(path) {\n        return path.match(/test\\//);\n      }).map(function(testPath) {\n        return \"require('./\" + testPath + \"')\";\n      }).join(\"\\n\");\n      return \"\" + (dependencyScripts(pkg.remoteDependencies)) + \"\\n<script>\\n  \" + (packageWrapper(pkg, testProgram)) + \"\\n<\\/script>\";\n    }\n  };\n\n  module.exports = Packager;\n\n  reject = function(message) {\n    return Deferred().reject(message);\n  };\n\n  html = function(pkg) {\n    return \"<!DOCTYPE html>\\n<html manifest=\\\"manifest.appcache?\" + (+(new Date)) + \"\\\">\\n<head>\\n<meta http-equiv=\\\"Content-Type\\\" content=\\\"text/html; charset=UTF-8\\\" />\\n\" + (dependencyScripts(pkg.remoteDependencies)) + \"\\n</head>\\n<body>\\n<script>\\n\" + (packageWrapper(pkg, \"require('./\" + pkg.entryPoint + \"')\")) + \"\\n<\\/script>\\n</body>\\n</html>\";\n  };\n\n  cacheManifest = function(pkg) {\n    return \"CACHE MANIFEST\\n# \" + (+(new Date)) + \"\\n\\nCACHE:\\nindex.html\\n\" + ((pkg.remoteDependencies || []).join(\"\\n\")) + \"\\n\\nNETWORK:\\nhttps://*\\nhttp://*\\n*\";\n  };\n\n  makeScript = function(src) {\n    var script;\n    script = document.createElement(\"script\");\n    script.src = src;\n    return script.outerHTML;\n  };\n\n  dependencyScripts = function(remoteDependencies) {\n    if (remoteDependencies == null) {\n      remoteDependencies = [];\n    }\n    return remoteDependencies.map(makeScript).join(\"\\n\");\n  };\n\n  jsonpWrapper = function(repository, data) {\n    return \"window[\\\"\" + repository.full_name + \":\" + repository.branch + \"\\\"](\" + data + \");\";\n  };\n\n  packageWrapper = function(pkg, code) {\n    return \";(function(PACKAGE) {\\nvar oldRequire = window.Require;\\n\" + PACKAGE.dependencies.require.distribution.main.content + \"\\nvar require = Require.generateFor(PACKAGE);\\nwindow.Require = oldRequire;\\n\" + code + \"\\n})(\" + (JSON.stringify(pkg, null, 2)) + \");\";\n  };\n\n  lookupCached = function(cache, fullName, branch) {\n    var name;\n    name = Object.keys(cache).select(function(key) {\n      var repository;\n      repository = cache[key].repository;\n      return repository.full_name === fullName && repository.branch === branch;\n    }).first();\n    if (name) {\n      return cache[name];\n    }\n  };\n\n}).call(this);\n\n//# sourceURL=packager.coffee",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.4.1\",\"entryPoint\":\"packager\",\"remoteDependencies\":[\"//code.jquery.com/jquery-1.10.1.min.js\",\"http://strd6.github.io/tempest/javascripts/envweb.js\"],\"dependencies\":{\"require\":\"STRd6/require:v0.2.2\"}};",
          "type": "blob"
        },
        "test/packager": {
          "path": "test/packager",
          "content": "(function() {\n  var Packager;\n\n  Packager = require(\"../packager\");\n\n  describe(\"Packager\", function() {\n    it(\"should exist\", function() {\n      return assert(Packager);\n    });\n    return it(\"should be able to create a standalone html page\", function() {\n      return assert(Packager.standAlone(PACKAGE));\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/packager.coffee",
          "type": "blob"
        }
      },
      "entryPoint": "packager",
      "dependencies": {
        "require": {
          "version": "0.2.2",
          "source": {
            "LICENSE": {
              "path": "LICENSE",
              "mode": "100644",
              "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
              "type": "blob"
            },
            "README.md": {
              "path": "README.md",
              "mode": "100644",
              "content": "require\n=======\n\nRequire system for self replicating client side apps\n",
              "type": "blob"
            },
            "main.coffee.md": {
              "path": "main.coffee.md",
              "mode": "100644",
              "content": "Require\n=======\n\nA Node.js compatible require implementation for pure client side apps.\n\nEach file is a module. Modules are responsible for exporting an object. Unlike\ntraditional client side JavaScript, Ruby, or other common languages the module\nis not responsible for naming its product in the context of the requirer. This\nmaintains encapsulation because it is impossible from within a module to know\nwhat external name would be correct to prevent errors of composition in all\npossible uses.\n\nDefinitions\n-----------\n\n## Module\n\nA module is a file.\n\n## Package\n\nA package is an aggregation of modules. A package is a json file that lives on\nthe internet.\n\nIt has the following properties:\n\n- distribution An object whose keys are paths an properties are `fileData`\n- entryPoint Path to the primary module that requiring this package will require.\n- dependencies An object whose keys are names and whose values are urls,\n  bundled packages, or package reference objects.\n\nIt may have additional properties such as `source`, `repository`, and `docs`.\n\n## Application\n\nAn application is a package which has an `entryPoint` and may have dependencies.\nAn application's dependencies may have dependencies. Dependencies may be\nbundled with a package or resolved at a separate time.\n\nUses\n----\n\nFrom a module require another module in the same package.\n\n>     require \"./soup\"\n\nRequire a module in the parent directory\n\n>     require \"../nuts\"\n\nRequire a module from the root directory in the same package\n\n>     require \"/silence\"\n\nFrom a module within a package, require a dependent package.\n\n>     require \"console\"\n\nThe dependency will be delcared something like\n\n>     dependencies:\n>       console: \"http://strd6.github.io/console/v1.2.2.json\"\n\nYou may also require an optional module from within another package\n\n>     require \"console/extras\"\n\nImplementation\n--------------\n\nFile separator is '/'\n\n    fileSeparator = '/'\n\nIn the browser `global` is `window`.\n\n    global = window\n\nDefault entry point\n\n    defaultEntryPoint = \"main\"\n\nA sentinal against circular requires.\n\n    circularGuard = {}\n\nA top-level module so that all other modules won't have to be orphans.\n\n    rootModule =\n      path: \"\"\n\nRequire a module given a path within a package. Each file is its own separate\nmodule. An application is composed of packages.\n\n    loadPath = (parentModule, pkg, path) ->\n      if startsWith(path, '/')\n        localPath = []\n      else\n        localPath = parentModule.path.split(fileSeparator)\n\n      normalizedPath = normalizePath(path, localPath)\n\n      cache = cacheFor(pkg)\n\n      if module = cache[normalizedPath]\n        if module is circularGuard\n          throw \"Circular dependency detected when requiring #{normalizedPath}\"\n      else\n        cache[normalizedPath] = circularGuard\n\n        try\n          cache[normalizedPath] = module = loadModule(pkg, normalizedPath)\n        finally\n          delete cache[normalizedPath] if cache[normalizedPath] is circularGuard\n\n      return module.exports\n\nTo normalize the path we convert local paths to a standard form that does not\ncontain an references to current or parent directories.\n\n    normalizePath = (path, base=[]) ->\n      base = base.concat path.split(fileSeparator)\n      result = []\n\nChew up all the pieces into a standardized path.\n\n      while base.length\n        switch piece = base.shift()\n          when \"..\"\n            result.pop()\n          when \"\", \".\"\n            # Skip\n          else\n            result.push(piece)\n\n      return result.join(fileSeparator)\n\n`loadPackage` Loads a module from a package, optionally specifying a path. If a\npath is given the module at that path is loaded, otherwise the `entryPoint`\nspecified in the package is loaded.\n\n    loadPackage = (parentModule, pkg, path) ->\n      path ||= (pkg.entryPoint || defaultEntryPoint)\n\n      loadPath(parentModule, pkg, path)\n\nLoad a file from within a package.\n\n    loadModule = (pkg, path) ->\n      unless (file = pkg.distribution[path])\n        throw \"Could not find file at #{path} in #{pkg.name}\"\n\n      program = file.content\n      dirname = path.split(fileSeparator)[0...-1].join(fileSeparator)\n\n      module =\n        path: dirname\n        exports: {}\n\nThis external context provides some variable that modules have access to.\n\nA `require` function is exposed to modules so they may require other modules.\n\nAdditional properties such as a reference to the global object and some metadata\nare also exposed.\n\n      context =\n        require: generateRequireFn(pkg, module)\n        global: global\n        module: module\n        exports: module.exports\n        PACKAGE: pkg\n        __filename: path\n        __dirname: dirname\n\n      args = Object.keys(context)\n      values = args.map (name) -> context[name]\n\nExecute the program within the module and given context.\n\n      Function(args..., program).apply(module, values)\n\n      return module\n\nHelper to detect if a given path is a package.\n\n    isPackage = (path) ->\n      if !(startsWith(path, fileSeparator) or\n        startsWith(path, \".#{fileSeparator}\") or\n        startsWith(path, \"..#{fileSeparator}\")\n      )\n        path.split(fileSeparator)[0]\n      else\n        false\n\nGenerate a require function for a given module in a package.\n\nIf we are loading a package in another module then we strip out the module part\nof the name and use the `rootModule` rather than the local module we came from.\nThat way our local path won't affect the lookup path in another package.\n\nLoading a module within our package, uses the requiring module as a parent for\nlocal path resolution.\n\n    generateRequireFn = (pkg, module=rootModule) ->\n      (path) ->\n        if otherPackageName = isPackage(path)\n          packagePath = path.replace(otherPackageName, \"\")\n\n          unless otherPackage = pkg.dependencies[otherPackageName]\n            throw \"Package: #{otherPackageName} not found.\"\n\n          otherPackage.name ?= otherPackageName\n\n          loadPackage(rootModule, otherPackage, packagePath)\n        else\n          loadPath(module, pkg, path)\n\nBecause we can't actually `require('require')` we need to export it a little\ndifferently.\n\n    if exports?\n      exports.generateFor = generateRequireFn\n    else\n      global.Require =\n        generateFor: generateRequireFn\n\nNotes\n-----\n\nWe have to use `pkg` because `package` is a reserved word.\n\nNode needs to check file extensions, but because we have a compile step we are\nable to compile all files extensionlessly based only on their path. So while\nNode may need to check for either `path/somefile.js` or `path/somefile.coffee`\nthat will already have been resolved for us and we will only check\n`path/somefile`\n\nFile extensions may come in handy if we want to skip the compile step and\ncompile on the fly at runtime.\n\nCircular dependencies aren't supported and will probably crash.\n\nHelpers\n-------\n\n    startsWith = (string, prefix) ->\n      string.lastIndexOf(prefix, 0) is 0\n\nCreates a cache for modules within a package.\n\n    cacheFor = (pkg) ->\n      return pkg.cache if pkg.cache\n\n      Object.defineProperty pkg, \"cache\",\n        value: {}\n\n      return pkg.cache\n",
              "type": "blob"
            },
            "pixie.cson": {
              "path": "pixie.cson",
              "mode": "100644",
              "content": "version: \"0.2.2\"\nremoteDependencies: [\n  \"http://strd6.github.io/require/v0.2.2.js\"\n]\n",
              "type": "blob"
            },
            "test/require.coffee.md": {
              "path": "test/require.coffee.md",
              "mode": "100644",
              "content": "Testing out this crazy require thing\n\n    # Load our latest require code for testing\n    # NOTE: This causes the root for relative requires to be at the root dir, not the test dir\n    latestRequire = require('/main').generateFor(PACKAGE)\n\n    describe \"require\", ->\n      it \"should not exist globally\", ->\n        assert !global.require\n\n      it \"should be able to require a file that exists with a relative path\", ->\n        assert latestRequire('/samples/terminal')\n\n      it \"should get whatever the file exports\", ->\n        assert latestRequire('/samples/terminal').something\n\n      it \"should not get something the file doesn't export\", ->\n        assert !latestRequire('/samples/terminal').something2\n\n      it \"should throw a descriptive error when requring circular dependencies\", ->\n        assert.throws ->\n          latestRequire('/samples/circular')\n        , /circular/i\n\n      it \"should throw a descriptive error when requiring a package that doesn't exist\", ->\n        assert.throws ->\n          latestRequire \"does_not_exist\"\n        , /not found/i\n\n      it \"should throw a descriptive error when requiring a relative path that doesn't exist\", ->\n        assert.throws ->\n          latestRequire \"/does_not_exist\"\n        , /Could not find file/i\n\n      it \"should recover gracefully enough from requiring files that throw errors\", ->\n        assert.throws ->\n          latestRequire \"/samples/throws\"\n\n        assert.throws ->\n          latestRequire \"/samples/throws\"\n        , (err) ->\n          !/circular/i.test err\n\n      it \"should cache modules\", ->\n        result = require(\"/samples/random\")\n\n        assert.equal require(\"/samples/random\"), result\n\n    describe \"module context\", ->\n      it \"should know __dirname\", ->\n        assert.equal \"test\", __dirname\n\n      it \"should know __filename\", ->\n        assert __filename\n\n      it \"should know its package\", ->\n        assert PACKAGE\n",
              "type": "blob"
            },
            "samples/random.coffee": {
              "path": "samples/random.coffee",
              "mode": "100644",
              "content": "# Returns a random value, used for testing caching\n\nmodule.exports = Math.random()\n",
              "type": "blob"
            },
            "samples/terminal.coffee": {
              "path": "samples/terminal.coffee",
              "mode": "100644",
              "content": "# A test file for requiring a file that has no dependencies. It should succeed.\n\nexports.something = true\n",
              "type": "blob"
            },
            "samples/circular.coffee": {
              "path": "samples/circular.coffee",
              "mode": "100644",
              "content": "# This test file illustrates a circular requirement and should throw an error.\n\nrequire \"./circular\"\n",
              "type": "blob"
            },
            "samples/throws.coffee": {
              "path": "samples/throws.coffee",
              "mode": "100644",
              "content": "# A test file that throws an error.\n\nthrow \"yolo\"\n",
              "type": "blob"
            }
          },
          "distribution": {
            "main": {
              "path": "main",
              "content": "(function() {\n  var cacheFor, circularGuard, defaultEntryPoint, fileSeparator, generateRequireFn, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule, startsWith,\n    __slice = [].slice;\n\n  fileSeparator = '/';\n\n  global = window;\n\n  defaultEntryPoint = \"main\";\n\n  circularGuard = {};\n\n  rootModule = {\n    path: \"\"\n  };\n\n  loadPath = function(parentModule, pkg, path) {\n    var cache, localPath, module, normalizedPath;\n    if (startsWith(path, '/')) {\n      localPath = [];\n    } else {\n      localPath = parentModule.path.split(fileSeparator);\n    }\n    normalizedPath = normalizePath(path, localPath);\n    cache = cacheFor(pkg);\n    if (module = cache[normalizedPath]) {\n      if (module === circularGuard) {\n        throw \"Circular dependency detected when requiring \" + normalizedPath;\n      }\n    } else {\n      cache[normalizedPath] = circularGuard;\n      try {\n        cache[normalizedPath] = module = loadModule(pkg, normalizedPath);\n      } finally {\n        if (cache[normalizedPath] === circularGuard) {\n          delete cache[normalizedPath];\n        }\n      }\n    }\n    return module.exports;\n  };\n\n  normalizePath = function(path, base) {\n    var piece, result;\n    if (base == null) {\n      base = [];\n    }\n    base = base.concat(path.split(fileSeparator));\n    result = [];\n    while (base.length) {\n      switch (piece = base.shift()) {\n        case \"..\":\n          result.pop();\n          break;\n        case \"\":\n        case \".\":\n          break;\n        default:\n          result.push(piece);\n      }\n    }\n    return result.join(fileSeparator);\n  };\n\n  loadPackage = function(parentModule, pkg, path) {\n    path || (path = pkg.entryPoint || defaultEntryPoint);\n    return loadPath(parentModule, pkg, path);\n  };\n\n  loadModule = function(pkg, path) {\n    var args, context, dirname, file, module, program, values;\n    if (!(file = pkg.distribution[path])) {\n      throw \"Could not find file at \" + path + \" in \" + pkg.name;\n    }\n    program = file.content;\n    dirname = path.split(fileSeparator).slice(0, -1).join(fileSeparator);\n    module = {\n      path: dirname,\n      exports: {}\n    };\n    context = {\n      require: generateRequireFn(pkg, module),\n      global: global,\n      module: module,\n      exports: module.exports,\n      PACKAGE: pkg,\n      __filename: path,\n      __dirname: dirname\n    };\n    args = Object.keys(context);\n    values = args.map(function(name) {\n      return context[name];\n    });\n    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);\n    return module;\n  };\n\n  isPackage = function(path) {\n    if (!(startsWith(path, fileSeparator) || startsWith(path, \".\" + fileSeparator) || startsWith(path, \"..\" + fileSeparator))) {\n      return path.split(fileSeparator)[0];\n    } else {\n      return false;\n    }\n  };\n\n  generateRequireFn = function(pkg, module) {\n    if (module == null) {\n      module = rootModule;\n    }\n    return function(path) {\n      var otherPackage, otherPackageName, packagePath;\n      if (otherPackageName = isPackage(path)) {\n        packagePath = path.replace(otherPackageName, \"\");\n        if (!(otherPackage = pkg.dependencies[otherPackageName])) {\n          throw \"Package: \" + otherPackageName + \" not found.\";\n        }\n        if (otherPackage.name == null) {\n          otherPackage.name = otherPackageName;\n        }\n        return loadPackage(rootModule, otherPackage, packagePath);\n      } else {\n        return loadPath(module, pkg, path);\n      }\n    };\n  };\n\n  if (typeof exports !== \"undefined\" && exports !== null) {\n    exports.generateFor = generateRequireFn;\n  } else {\n    global.Require = {\n      generateFor: generateRequireFn\n    };\n  }\n\n  startsWith = function(string, prefix) {\n    return string.lastIndexOf(prefix, 0) === 0;\n  };\n\n  cacheFor = function(pkg) {\n    if (pkg.cache) {\n      return pkg.cache;\n    }\n    Object.defineProperty(pkg, \"cache\", {\n      value: {}\n    });\n    return pkg.cache;\n  };\n\n}).call(this);\n\n//# sourceURL=main.coffee",
              "type": "blob"
            },
            "pixie": {
              "path": "pixie",
              "content": "module.exports = {\"version\":\"0.2.2\",\"remoteDependencies\":[\"http://strd6.github.io/require/v0.2.2.js\"]};",
              "type": "blob"
            },
            "test/require": {
              "path": "test/require",
              "content": "(function() {\n  var latestRequire;\n\n  latestRequire = require('/main').generateFor(PACKAGE);\n\n  describe(\"require\", function() {\n    it(\"should not exist globally\", function() {\n      return assert(!global.require);\n    });\n    it(\"should be able to require a file that exists with a relative path\", function() {\n      return assert(latestRequire('/samples/terminal'));\n    });\n    it(\"should get whatever the file exports\", function() {\n      return assert(latestRequire('/samples/terminal').something);\n    });\n    it(\"should not get something the file doesn't export\", function() {\n      return assert(!latestRequire('/samples/terminal').something2);\n    });\n    it(\"should throw a descriptive error when requring circular dependencies\", function() {\n      return assert.throws(function() {\n        return latestRequire('/samples/circular');\n      }, /circular/i);\n    });\n    it(\"should throw a descriptive error when requiring a package that doesn't exist\", function() {\n      return assert.throws(function() {\n        return latestRequire(\"does_not_exist\");\n      }, /not found/i);\n    });\n    it(\"should throw a descriptive error when requiring a relative path that doesn't exist\", function() {\n      return assert.throws(function() {\n        return latestRequire(\"/does_not_exist\");\n      }, /Could not find file/i);\n    });\n    it(\"should recover gracefully enough from requiring files that throw errors\", function() {\n      assert.throws(function() {\n        return latestRequire(\"/samples/throws\");\n      });\n      return assert.throws(function() {\n        return latestRequire(\"/samples/throws\");\n      }, function(err) {\n        return !/circular/i.test(err);\n      });\n    });\n    return it(\"should cache modules\", function() {\n      var result;\n      result = require(\"/samples/random\");\n      return assert.equal(require(\"/samples/random\"), result);\n    });\n  });\n\n  describe(\"module context\", function() {\n    it(\"should know __dirname\", function() {\n      return assert.equal(\"test\", __dirname);\n    });\n    it(\"should know __filename\", function() {\n      return assert(__filename);\n    });\n    return it(\"should know its package\", function() {\n      return assert(PACKAGE);\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/require.coffee",
              "type": "blob"
            },
            "samples/random": {
              "path": "samples/random",
              "content": "(function() {\n  module.exports = Math.random();\n\n}).call(this);\n\n//# sourceURL=samples/random.coffee",
              "type": "blob"
            },
            "samples/terminal": {
              "path": "samples/terminal",
              "content": "(function() {\n  exports.something = true;\n\n}).call(this);\n\n//# sourceURL=samples/terminal.coffee",
              "type": "blob"
            },
            "samples/circular": {
              "path": "samples/circular",
              "content": "(function() {\n  require(\"./circular\");\n\n}).call(this);\n\n//# sourceURL=samples/circular.coffee",
              "type": "blob"
            },
            "samples/throws": {
              "path": "samples/throws",
              "content": "(function() {\n  throw \"yolo\";\n\n}).call(this);\n\n//# sourceURL=samples/throws.coffee",
              "type": "blob"
            }
          },
          "entryPoint": "main",
          "dependencies": {},
          "remoteDependencies": [
            "http://strd6.github.io/require/v0.2.2.js"
          ],
          "repository": {
            "id": 12814740,
            "name": "require",
            "full_name": "STRd6/require",
            "owner": {
              "login": "STRd6",
              "id": 18894,
              "avatar_url": "https://2.gravatar.com/avatar/33117162fff8a9cf50544a604f60c045?d=https%3A%2F%2Fidenticons.github.com%2F39df222bffe39629d904e4883eabc654.png",
              "gravatar_id": "33117162fff8a9cf50544a604f60c045",
              "url": "https://api.github.com/users/STRd6",
              "html_url": "https://github.com/STRd6",
              "followers_url": "https://api.github.com/users/STRd6/followers",
              "following_url": "https://api.github.com/users/STRd6/following{/other_user}",
              "gists_url": "https://api.github.com/users/STRd6/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/STRd6/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/STRd6/subscriptions",
              "organizations_url": "https://api.github.com/users/STRd6/orgs",
              "repos_url": "https://api.github.com/users/STRd6/repos",
              "events_url": "https://api.github.com/users/STRd6/events{/privacy}",
              "received_events_url": "https://api.github.com/users/STRd6/received_events",
              "type": "User"
            },
            "private": false,
            "html_url": "https://github.com/STRd6/require",
            "description": "Require system for self replicating client side apps",
            "fork": false,
            "url": "https://api.github.com/repos/STRd6/require",
            "forks_url": "https://api.github.com/repos/STRd6/require/forks",
            "keys_url": "https://api.github.com/repos/STRd6/require/keys{/key_id}",
            "collaborators_url": "https://api.github.com/repos/STRd6/require/collaborators{/collaborator}",
            "teams_url": "https://api.github.com/repos/STRd6/require/teams",
            "hooks_url": "https://api.github.com/repos/STRd6/require/hooks",
            "issue_events_url": "https://api.github.com/repos/STRd6/require/issues/events{/number}",
            "events_url": "https://api.github.com/repos/STRd6/require/events",
            "assignees_url": "https://api.github.com/repos/STRd6/require/assignees{/user}",
            "branches_url": "https://api.github.com/repos/STRd6/require/branches{/branch}",
            "tags_url": "https://api.github.com/repos/STRd6/require/tags",
            "blobs_url": "https://api.github.com/repos/STRd6/require/git/blobs{/sha}",
            "git_tags_url": "https://api.github.com/repos/STRd6/require/git/tags{/sha}",
            "git_refs_url": "https://api.github.com/repos/STRd6/require/git/refs{/sha}",
            "trees_url": "https://api.github.com/repos/STRd6/require/git/trees{/sha}",
            "statuses_url": "https://api.github.com/repos/STRd6/require/statuses/{sha}",
            "languages_url": "https://api.github.com/repos/STRd6/require/languages",
            "stargazers_url": "https://api.github.com/repos/STRd6/require/stargazers",
            "contributors_url": "https://api.github.com/repos/STRd6/require/contributors",
            "subscribers_url": "https://api.github.com/repos/STRd6/require/subscribers",
            "subscription_url": "https://api.github.com/repos/STRd6/require/subscription",
            "commits_url": "https://api.github.com/repos/STRd6/require/commits{/sha}",
            "git_commits_url": "https://api.github.com/repos/STRd6/require/git/commits{/sha}",
            "comments_url": "https://api.github.com/repos/STRd6/require/comments{/number}",
            "issue_comment_url": "https://api.github.com/repos/STRd6/require/issues/comments/{number}",
            "contents_url": "https://api.github.com/repos/STRd6/require/contents/{+path}",
            "compare_url": "https://api.github.com/repos/STRd6/require/compare/{base}...{head}",
            "merges_url": "https://api.github.com/repos/STRd6/require/merges",
            "archive_url": "https://api.github.com/repos/STRd6/require/{archive_format}{/ref}",
            "downloads_url": "https://api.github.com/repos/STRd6/require/downloads",
            "issues_url": "https://api.github.com/repos/STRd6/require/issues{/number}",
            "pulls_url": "https://api.github.com/repos/STRd6/require/pulls{/number}",
            "milestones_url": "https://api.github.com/repos/STRd6/require/milestones{/number}",
            "notifications_url": "https://api.github.com/repos/STRd6/require/notifications{?since,all,participating}",
            "labels_url": "https://api.github.com/repos/STRd6/require/labels{/name}",
            "created_at": "2013-09-13T17:00:23Z",
            "updated_at": "2013-10-01T02:42:41Z",
            "pushed_at": "2013-10-01T02:42:40Z",
            "git_url": "git://github.com/STRd6/require.git",
            "ssh_url": "git@github.com:STRd6/require.git",
            "clone_url": "https://github.com/STRd6/require.git",
            "svn_url": "https://github.com/STRd6/require",
            "homepage": null,
            "size": 3288,
            "watchers_count": 1,
            "language": "CoffeeScript",
            "has_issues": true,
            "has_downloads": true,
            "has_wiki": true,
            "forks_count": 0,
            "mirror_url": null,
            "open_issues_count": 1,
            "forks": 0,
            "open_issues": 1,
            "watchers": 1,
            "master_branch": "master",
            "default_branch": "master",
            "permissions": {
              "admin": true,
              "push": true,
              "pull": true
            },
            "network_count": 0,
            "branch": "v0.2.2",
            "defaultBranch": "master",
            "includedModules": [
              "Bindable"
            ]
          },
          "progenitor": {
            "url": "http://strd6.github.io/editor/"
          }
        }
      },
      "remoteDependencies": [
        "//code.jquery.com/jquery-1.10.1.min.js",
        "http://strd6.github.io/tempest/javascripts/envweb.js"
      ],
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "repository": {
        "id": 13223375,
        "name": "packager",
        "full_name": "STRd6/packager",
        "owner": {
          "login": "STRd6",
          "id": 18894,
          "avatar_url": "https://0.gravatar.com/avatar/33117162fff8a9cf50544a604f60c045?d=https%3A%2F%2Fidenticons.github.com%2F39df222bffe39629d904e4883eabc654.png&r=x",
          "gravatar_id": "33117162fff8a9cf50544a604f60c045",
          "url": "https://api.github.com/users/STRd6",
          "html_url": "https://github.com/STRd6",
          "followers_url": "https://api.github.com/users/STRd6/followers",
          "following_url": "https://api.github.com/users/STRd6/following{/other_user}",
          "gists_url": "https://api.github.com/users/STRd6/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/STRd6/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/STRd6/subscriptions",
          "organizations_url": "https://api.github.com/users/STRd6/orgs",
          "repos_url": "https://api.github.com/users/STRd6/repos",
          "events_url": "https://api.github.com/users/STRd6/events{/privacy}",
          "received_events_url": "https://api.github.com/users/STRd6/received_events",
          "type": "User",
          "site_admin": false
        },
        "private": false,
        "html_url": "https://github.com/STRd6/packager",
        "description": "Create standalone build products for web packages",
        "fork": false,
        "url": "https://api.github.com/repos/STRd6/packager",
        "forks_url": "https://api.github.com/repos/STRd6/packager/forks",
        "keys_url": "https://api.github.com/repos/STRd6/packager/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/STRd6/packager/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/STRd6/packager/teams",
        "hooks_url": "https://api.github.com/repos/STRd6/packager/hooks",
        "issue_events_url": "https://api.github.com/repos/STRd6/packager/issues/events{/number}",
        "events_url": "https://api.github.com/repos/STRd6/packager/events",
        "assignees_url": "https://api.github.com/repos/STRd6/packager/assignees{/user}",
        "branches_url": "https://api.github.com/repos/STRd6/packager/branches{/branch}",
        "tags_url": "https://api.github.com/repos/STRd6/packager/tags",
        "blobs_url": "https://api.github.com/repos/STRd6/packager/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/STRd6/packager/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/STRd6/packager/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/STRd6/packager/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/STRd6/packager/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/STRd6/packager/languages",
        "stargazers_url": "https://api.github.com/repos/STRd6/packager/stargazers",
        "contributors_url": "https://api.github.com/repos/STRd6/packager/contributors",
        "subscribers_url": "https://api.github.com/repos/STRd6/packager/subscribers",
        "subscription_url": "https://api.github.com/repos/STRd6/packager/subscription",
        "commits_url": "https://api.github.com/repos/STRd6/packager/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/STRd6/packager/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/STRd6/packager/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/STRd6/packager/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/STRd6/packager/contents/{+path}",
        "compare_url": "https://api.github.com/repos/STRd6/packager/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/STRd6/packager/merges",
        "archive_url": "https://api.github.com/repos/STRd6/packager/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/STRd6/packager/downloads",
        "issues_url": "https://api.github.com/repos/STRd6/packager/issues{/number}",
        "pulls_url": "https://api.github.com/repos/STRd6/packager/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/STRd6/packager/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/STRd6/packager/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/STRd6/packager/labels{/name}",
        "releases_url": "https://api.github.com/repos/STRd6/packager/releases{/id}",
        "created_at": "2013-09-30T18:28:31Z",
        "updated_at": "2013-11-24T02:45:42Z",
        "pushed_at": "2013-11-24T02:45:41Z",
        "git_url": "git://github.com/STRd6/packager.git",
        "ssh_url": "git@github.com:STRd6/packager.git",
        "clone_url": "https://github.com/STRd6/packager.git",
        "svn_url": "https://github.com/STRd6/packager",
        "homepage": null,
        "size": 3444,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "CoffeeScript",
        "has_issues": true,
        "has_downloads": true,
        "has_wiki": true,
        "forks_count": 0,
        "mirror_url": null,
        "open_issues_count": 1,
        "forks": 0,
        "open_issues": 1,
        "watchers": 0,
        "default_branch": "master",
        "master_branch": "master",
        "permissions": {
          "admin": true,
          "push": true,
          "pull": true
        },
        "network_count": 0,
        "subscribers_count": 1,
        "branch": "v0.4.1",
        "defaultBranch": "master"
      }
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "repository": {
    "id": 14807528,
    "name": "builder",
    "full_name": "distri/builder",
    "owner": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://identicons.github.com/f90c81ffc1498e260c820082f2e7ca5f.png",
      "gravatar_id": null,
      "url": "https://api.github.com/users/distri",
      "html_url": "https://github.com/distri",
      "followers_url": "https://api.github.com/users/distri/followers",
      "following_url": "https://api.github.com/users/distri/following{/other_user}",
      "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
      "organizations_url": "https://api.github.com/users/distri/orgs",
      "repos_url": "https://api.github.com/users/distri/repos",
      "events_url": "https://api.github.com/users/distri/events{/privacy}",
      "received_events_url": "https://api.github.com/users/distri/received_events",
      "type": "Organization",
      "site_admin": false
    },
    "private": false,
    "html_url": "https://github.com/distri/builder",
    "description": "A builder for distri apps.",
    "fork": false,
    "url": "https://api.github.com/repos/distri/builder",
    "forks_url": "https://api.github.com/repos/distri/builder/forks",
    "keys_url": "https://api.github.com/repos/distri/builder/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/distri/builder/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/distri/builder/teams",
    "hooks_url": "https://api.github.com/repos/distri/builder/hooks",
    "issue_events_url": "https://api.github.com/repos/distri/builder/issues/events{/number}",
    "events_url": "https://api.github.com/repos/distri/builder/events",
    "assignees_url": "https://api.github.com/repos/distri/builder/assignees{/user}",
    "branches_url": "https://api.github.com/repos/distri/builder/branches{/branch}",
    "tags_url": "https://api.github.com/repos/distri/builder/tags",
    "blobs_url": "https://api.github.com/repos/distri/builder/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/distri/builder/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/distri/builder/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/distri/builder/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/distri/builder/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/distri/builder/languages",
    "stargazers_url": "https://api.github.com/repos/distri/builder/stargazers",
    "contributors_url": "https://api.github.com/repos/distri/builder/contributors",
    "subscribers_url": "https://api.github.com/repos/distri/builder/subscribers",
    "subscription_url": "https://api.github.com/repos/distri/builder/subscription",
    "commits_url": "https://api.github.com/repos/distri/builder/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/distri/builder/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/distri/builder/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/distri/builder/issues/comments/{number}",
    "contents_url": "https://api.github.com/repos/distri/builder/contents/{+path}",
    "compare_url": "https://api.github.com/repos/distri/builder/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/distri/builder/merges",
    "archive_url": "https://api.github.com/repos/distri/builder/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/distri/builder/downloads",
    "issues_url": "https://api.github.com/repos/distri/builder/issues{/number}",
    "pulls_url": "https://api.github.com/repos/distri/builder/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/distri/builder/milestones{/number}",
    "notifications_url": "https://api.github.com/repos/distri/builder/notifications{?since,all,participating}",
    "labels_url": "https://api.github.com/repos/distri/builder/labels{/name}",
    "releases_url": "https://api.github.com/repos/distri/builder/releases{/id}",
    "created_at": "2013-11-29T17:58:27Z",
    "updated_at": "2013-11-29T17:58:27Z",
    "pushed_at": "2013-11-29T17:58:27Z",
    "git_url": "git://github.com/distri/builder.git",
    "ssh_url": "git@github.com:distri/builder.git",
    "clone_url": "https://github.com/distri/builder.git",
    "svn_url": "https://github.com/distri/builder",
    "homepage": null,
    "size": 0,
    "stargazers_count": 0,
    "watchers_count": 0,
    "language": null,
    "has_issues": true,
    "has_downloads": true,
    "has_wiki": true,
    "forks_count": 0,
    "mirror_url": null,
    "open_issues_count": 0,
    "forks": 0,
    "open_issues": 0,
    "watchers": 0,
    "default_branch": "master",
    "master_branch": "master",
    "permissions": {
      "admin": true,
      "push": true,
      "pull": true
    },
    "organization": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://identicons.github.com/f90c81ffc1498e260c820082f2e7ca5f.png",
      "gravatar_id": null,
      "url": "https://api.github.com/users/distri",
      "html_url": "https://github.com/distri",
      "followers_url": "https://api.github.com/users/distri/followers",
      "following_url": "https://api.github.com/users/distri/following{/other_user}",
      "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
      "organizations_url": "https://api.github.com/users/distri/orgs",
      "repos_url": "https://api.github.com/users/distri/repos",
      "events_url": "https://api.github.com/users/distri/events{/privacy}",
      "received_events_url": "https://api.github.com/users/distri/received_events",
      "type": "Organization",
      "site_admin": false
    },
    "network_count": 0,
    "subscribers_count": 2,
    "branch": "master",
    "defaultBranch": "master"
  }
});