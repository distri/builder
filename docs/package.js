(function(pkg) {
  (function() {
  var annotateSourceURL, cacheFor, circularGuard, defaultEntryPoint, fileSeparator, generateRequireFn, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule, startsWith,
    __slice = [].slice;

  fileSeparator = '/';

  global = window;

  defaultEntryPoint = "main";

  circularGuard = {};

  rootModule = {
    path: ""
  };

  loadPath = function(parentModule, pkg, path) {
    var cache, localPath, module, normalizedPath;
    if (startsWith(path, '/')) {
      localPath = [];
    } else {
      localPath = parentModule.path.split(fileSeparator);
    }
    normalizedPath = normalizePath(path, localPath);
    cache = cacheFor(pkg);
    if (module = cache[normalizedPath]) {
      if (module === circularGuard) {
        throw "Circular dependency detected when requiring " + normalizedPath;
      }
    } else {
      cache[normalizedPath] = circularGuard;
      try {
        cache[normalizedPath] = module = loadModule(pkg, normalizedPath);
      } finally {
        if (cache[normalizedPath] === circularGuard) {
          delete cache[normalizedPath];
        }
      }
    }
    return module.exports;
  };

  normalizePath = function(path, base) {
    var piece, result;
    if (base == null) {
      base = [];
    }
    base = base.concat(path.split(fileSeparator));
    result = [];
    while (base.length) {
      switch (piece = base.shift()) {
        case "..":
          result.pop();
          break;
        case "":
        case ".":
          break;
        default:
          result.push(piece);
      }
    }
    return result.join(fileSeparator);
  };

  loadPackage = function(pkg) {
    var path;
    path = pkg.entryPoint || defaultEntryPoint;
    return loadPath(rootModule, pkg, path);
  };

  loadModule = function(pkg, path) {
    var args, context, dirname, file, module, program, values;
    if (!(file = pkg.distribution[path])) {
      throw "Could not find file at " + path + " in " + pkg.name;
    }
    program = annotateSourceURL(file.content, pkg, path);
    dirname = path.split(fileSeparator).slice(0, -1).join(fileSeparator);
    module = {
      path: dirname,
      exports: {}
    };
    context = {
      require: generateRequireFn(pkg, module),
      global: global,
      module: module,
      exports: module.exports,
      PACKAGE: pkg,
      __filename: path,
      __dirname: dirname
    };
    args = Object.keys(context);
    values = args.map(function(name) {
      return context[name];
    });
    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);
    return module;
  };

  isPackage = function(path) {
    if (!(startsWith(path, fileSeparator) || startsWith(path, "." + fileSeparator) || startsWith(path, ".." + fileSeparator))) {
      return path.split(fileSeparator)[0];
    } else {
      return false;
    }
  };

  generateRequireFn = function(pkg, module) {
    if (module == null) {
      module = rootModule;
    }
    if (pkg.name == null) {
      pkg.name = "ROOT";
    }
    if (pkg.scopedName == null) {
      pkg.scopedName = "ROOT";
    }
    return function(path) {
      var otherPackage;
      if (isPackage(path)) {
        if (!(otherPackage = pkg.dependencies[path])) {
          throw "Package: " + path + " not found.";
        }
        if (otherPackage.name == null) {
          otherPackage.name = path;
        }
        if (otherPackage.scopedName == null) {
          otherPackage.scopedName = "" + pkg.scopedName + ":" + path;
        }
        return loadPackage(otherPackage);
      } else {
        return loadPath(module, pkg, path);
      }
    };
  };

  if (typeof exports !== "undefined" && exports !== null) {
    exports.generateFor = generateRequireFn;
  } else {
    global.Require = {
      generateFor: generateRequireFn
    };
  }

  startsWith = function(string, prefix) {
    return string.lastIndexOf(prefix, 0) === 0;
  };

  cacheFor = function(pkg) {
    if (pkg.cache) {
      return pkg.cache;
    }
    Object.defineProperty(pkg, "cache", {
      value: {}
    });
    return pkg.cache;
  };

  annotateSourceURL = function(program, pkg, path) {
    return "" + program + "\n//# sourceURL=" + pkg.scopedName + "/" + path;
  };

}).call(this);

//# sourceURL=main.coffee
  window.require = Require.generateFor(pkg);
})({
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
    "TODO": {
      "path": "TODO",
      "mode": "100644",
      "content": "TODO\n====\n\nRemove jQuery dependency.\n\nMove adding dependencies to a post processor.\n\nPipes instead of deferred for post processors.\n",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "mode": "100644",
      "content": "Builder\n=======\n\nThe builder knows how to compile a source tree or individual files into various\nbuild products.\n\nHelpers\n-------\n    CSON = require \"cson\"\n    HamlJr = require \"haml-jr\"\n\n    Deferred = $.Deferred\n\n    arrayToHash = (array) ->\n      array.reduce (hash, file) ->\n        hash[file.path] = file\n        hash\n      , {}\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\n    fileExtension = (str) ->\n      if match = str.match(/\\.([^\\.]*)$/, '')\n        match[match.length - 1]\n      else\n        ''\n\n    withoutExtension = (str) ->\n      str.replace(/\\.[^\\.]*$/,\"\")\n\n`stripMarkdown` converts a literate file into pure code for compilation or execution.\n\n    stripMarkdown = (content) ->\n      content.split(\"\\n\").map (line) ->\n        if match = (/^([ ]{4}|\\t)/).exec line\n          line[match[0].length..]\n        else\n          \"\"\n      .join(\"\\n\")\n\n`compileTemplate` compiles a haml file into a HamlJr program.\n\n    compileTemplate = (source) ->\n      \"\"\"\n        Runtime = require(\"/_lib/hamljr_runtime\");\n\n        module.exports = #{HamlJr.compile(source, {compiler: CoffeeScript})}\n      \"\"\"\n\n`stringData` exports a string of text. When you require a file that exports\nstring data it returns the string for you to use in your code. This is handy for\nCSS or other textually based data.\n\n    stringData = (source) ->\n      \"module.exports = #{JSON.stringify(source)};\"\n\n`compileStyl` compiles a styl file into CSS and makes it available as a string\nexport.\n\n    compileStyl = (source) ->\n      styleContent = styl(source, whitespace: true).toString()\n\n      stringData(styleContent)\n\n`compileCoffee` compiles a coffee file into JS. The `require` library handles\nappending a sourceURL comment to assist in debugging.\n\n    compileCoffee = (source, path) ->\n      CoffeeScript.compile(source)\n\n`compileFile` take a fileData and returns a buildData. A buildData has a `path`,\nand properties for what type of content was built.\n\n    compileFile = ({path, content}) ->\n      [name, extension] = [withoutExtension(path), fileExtension(path)]\n\n      result =\n        switch extension\n          when \"js\"\n            code: content\n          when \"json\"\n            code: stringData(JSON.parse(content))\n          when \"cson\"\n            code: stringData(CSON.parse(content))\n          when \"coffee\"\n            code: compileCoffee(content, path)\n          when \"haml\"\n            code: compileTemplate(content, name)\n          when \"styl\"\n            code: compileStyl(content)\n          when \"css\"\n            code: stringData(content)\n          when \"md\"\n            # Separate out code and call compile again\n            compileFile\n              path: name\n              content: stripMarkdown(content)\n          else\n            {}\n\n      result.name ?= name\n      result.extension ?= extension\n\n      extend result,\n        path: path\n\nBuilder\n-------\n\nThe builder instance.\n\nTODO: Standardize interface to use promises or pipes.\n\n    Builder = ->\n      build = (fileData) ->\n        results = fileData.map (datum) ->\n          {path} = datum\n\n          try\n            (cached compileFile) datum\n          catch {location, message}\n            if location?\n              message = \"Error on line #{location.first_line + 1}: #{message}\"\n\n            error: \"#{path} - #{message}\"\n\n        errors = results.filter (result) -> result.error\n        data = results.filter (result) -> !result.error\n\n        if errors.length\n          Deferred().reject(errors.map (e) -> e.error)\n        else\n          # Add the HamlJr runtime if any templates were compiled\n          hasHaml = fileData.some ({path}) ->\n            path.match /.*\\.haml(\\..*)?$/\n\n          if hasHaml\n            data.push\n              name: \"_lib/hamljr_runtime\"\n              code: PACKAGE.dependencies[\"haml-jr\"].distribution.runtime.content # Kinda gross\n\n          Deferred().resolve(data)\n\nPost processors operate on the built package.\n\nTODO: Maybe we should split post processors into the packager.\n\n      postProcessors = []\n\n      addPostProcessor: (fn) ->\n        postProcessors.push fn\n\nCompile and build a tree of file data into a distribution. The distribution should\ninclude source files, compiled files, and documentation.\n\n      build: (fileData, cache={}) ->\n        build(fileData)\n        .then (items) ->\n\n          results =\n            items.filter (item) ->\n              item.code\n            .map (item) ->\n              path: item.name\n              content: item.code\n              type: \"blob\"\n\n          source = arrayToHash(fileData)\n\n          pkg =\n            source: source\n            distribution: arrayToHash(results)\n\n          postProcessors.forEach (fn) ->\n            fn(pkg)\n\n          return pkg\n\n    module.exports = Builder\n\nCache\n-----\n\n    compilerCache = {}\n\n    cached = (compileFn) ->\n      (data) ->\n        {path, sha, content} = data\n        if sha\n          key = \"#{path}:#{sha}\"\n          compilerCache[key] or compilerCache[key] = compileFn(data)\n        else\n          compileFn(data)\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.3.7\"\nentryPoint: \"main\"\nremoteDependencies: [\n  \"https://code.jquery.com/jquery-1.10.1.min.js\"\n  \"https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"\n]\ndependencies:\n  cson: \"distri/cson:v0.1.0\"\n  \"haml-jr\": \"distri/haml-jr:v0.2.1\"\n",
      "type": "blob"
    },
    "samples/haml.haml": {
      "path": "samples/haml.haml",
      "mode": "100644",
      "content": "%h1 Super cool sample\n\n= \"yo/lo\"\n",
      "type": "blob"
    },
    "test/builder.coffee": {
      "path": "test/builder.coffee",
      "mode": "100644",
      "content": "global.require = require\nglobal.PACKAGE = PACKAGE\n\nBuilder = require \"../main\"\n\ndescribe \"Builder\", ->\n  it \"should exist\", ->\n    assert Builder\n\n  it \"should build\", ->\n    builder = Builder()\n\n    fileData = Object.keys(PACKAGE.source).map (path) ->\n      PACKAGE.source[path]\n\n    builder.build(fileData).then (result) ->\n      console.log result\n    , (errors) ->\n      throw errors[0]\n\n  it \"should build haml\", (done) ->\n    builder = Builder()\n\n    fileData = Object.keys(PACKAGE.source).map (path) ->\n      PACKAGE.source[path]\n\n    builder.build(fileData).then (result) ->\n      assert result.distribution[\"_lib/hamljr_runtime\"].content\n      assert result.distribution[\"samples/haml\"].content\n      done()\n    , (errors) ->\n      throw errors[0]\n",
      "type": "blob"
    }
  },
  "distribution": {
    "main": {
      "path": "main",
      "content": "(function() {\n  var Builder, CSON, Deferred, HamlJr, arrayToHash, cached, compileCoffee, compileFile, compileStyl, compileTemplate, compilerCache, extend, fileExtension, stringData, stripMarkdown, withoutExtension,\n    __slice = [].slice;\n\n  CSON = require(\"cson\");\n\n  HamlJr = require(\"haml-jr\");\n\n  Deferred = $.Deferred;\n\n  arrayToHash = function(array) {\n    return array.reduce(function(hash, file) {\n      hash[file.path] = file;\n      return hash;\n    }, {});\n  };\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  fileExtension = function(str) {\n    var match;\n    if (match = str.match(/\\.([^\\.]*)$/, '')) {\n      return match[match.length - 1];\n    } else {\n      return '';\n    }\n  };\n\n  withoutExtension = function(str) {\n    return str.replace(/\\.[^\\.]*$/, \"\");\n  };\n\n  stripMarkdown = function(content) {\n    return content.split(\"\\n\").map(function(line) {\n      var match;\n      if (match = /^([ ]{4}|\\t)/.exec(line)) {\n        return line.slice(match[0].length);\n      } else {\n        return \"\";\n      }\n    }).join(\"\\n\");\n  };\n\n  compileTemplate = function(source) {\n    return \"Runtime = require(\\\"/_lib/hamljr_runtime\\\");\\n\\nmodule.exports = \" + (HamlJr.compile(source, {\n      compiler: CoffeeScript\n    }));\n  };\n\n  stringData = function(source) {\n    return \"module.exports = \" + (JSON.stringify(source)) + \";\";\n  };\n\n  compileStyl = function(source) {\n    var styleContent;\n    styleContent = styl(source, {\n      whitespace: true\n    }).toString();\n    return stringData(styleContent);\n  };\n\n  compileCoffee = function(source, path) {\n    return CoffeeScript.compile(source);\n  };\n\n  compileFile = function(_arg) {\n    var content, extension, name, path, result, _ref;\n    path = _arg.path, content = _arg.content;\n    _ref = [withoutExtension(path), fileExtension(path)], name = _ref[0], extension = _ref[1];\n    result = (function() {\n      switch (extension) {\n        case \"js\":\n          return {\n            code: content\n          };\n        case \"json\":\n          return {\n            code: stringData(JSON.parse(content))\n          };\n        case \"cson\":\n          return {\n            code: stringData(CSON.parse(content))\n          };\n        case \"coffee\":\n          return {\n            code: compileCoffee(content, path)\n          };\n        case \"haml\":\n          return {\n            code: compileTemplate(content, name)\n          };\n        case \"styl\":\n          return {\n            code: compileStyl(content)\n          };\n        case \"css\":\n          return {\n            code: stringData(content)\n          };\n        case \"md\":\n          return compileFile({\n            path: name,\n            content: stripMarkdown(content)\n          });\n        default:\n          return {};\n      }\n    })();\n    if (result.name == null) {\n      result.name = name;\n    }\n    if (result.extension == null) {\n      result.extension = extension;\n    }\n    return extend(result, {\n      path: path\n    });\n  };\n\n  Builder = function() {\n    var build, postProcessors;\n    build = function(fileData) {\n      var data, errors, hasHaml, results;\n      results = fileData.map(function(datum) {\n        var location, message, path;\n        path = datum.path;\n        try {\n          return (cached(compileFile))(datum);\n        } catch (_error) {\n          location = _error.location, message = _error.message;\n          if (location != null) {\n            message = \"Error on line \" + (location.first_line + 1) + \": \" + message;\n          }\n          return {\n            error: \"\" + path + \" - \" + message\n          };\n        }\n      });\n      errors = results.filter(function(result) {\n        return result.error;\n      });\n      data = results.filter(function(result) {\n        return !result.error;\n      });\n      if (errors.length) {\n        return Deferred().reject(errors.map(function(e) {\n          return e.error;\n        }));\n      } else {\n        hasHaml = fileData.some(function(_arg) {\n          var path;\n          path = _arg.path;\n          return path.match(/.*\\.haml(\\..*)?$/);\n        });\n        if (hasHaml) {\n          data.push({\n            name: \"_lib/hamljr_runtime\",\n            code: PACKAGE.dependencies[\"haml-jr\"].distribution.runtime.content\n          });\n        }\n        return Deferred().resolve(data);\n      }\n    };\n    postProcessors = [];\n    return {\n      addPostProcessor: function(fn) {\n        return postProcessors.push(fn);\n      },\n      build: function(fileData, cache) {\n        if (cache == null) {\n          cache = {};\n        }\n        return build(fileData).then(function(items) {\n          var pkg, results, source;\n          results = items.filter(function(item) {\n            return item.code;\n          }).map(function(item) {\n            return {\n              path: item.name,\n              content: item.code,\n              type: \"blob\"\n            };\n          });\n          source = arrayToHash(fileData);\n          pkg = {\n            source: source,\n            distribution: arrayToHash(results)\n          };\n          postProcessors.forEach(function(fn) {\n            return fn(pkg);\n          });\n          return pkg;\n        });\n      }\n    };\n  };\n\n  module.exports = Builder;\n\n  compilerCache = {};\n\n  cached = function(compileFn) {\n    return function(data) {\n      var content, key, path, sha;\n      path = data.path, sha = data.sha, content = data.content;\n      if (sha) {\n        key = \"\" + path + \":\" + sha;\n        return compilerCache[key] || (compilerCache[key] = compileFn(data));\n      } else {\n        return compileFn(data);\n      }\n    };\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.3.7\",\"entryPoint\":\"main\",\"remoteDependencies\":[\"https://code.jquery.com/jquery-1.10.1.min.js\",\"https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"],\"dependencies\":{\"cson\":\"distri/cson:v0.1.0\",\"haml-jr\":\"distri/haml-jr:v0.2.1\"}};",
      "type": "blob"
    },
    "samples/haml": {
      "path": "samples/haml",
      "content": "Runtime = require(\"/_lib/hamljr_runtime\");\n\nmodule.exports = (function(data) {\n  return (function() {\n    var __runtime;\n    __runtime = Runtime(this);\n    __runtime.push(document.createDocumentFragment());\n    __runtime.push(document.createElement(\"h1\"));\n    __runtime.text(\"Super cool sample\\n\");\n    __runtime.pop();\n    __runtime.text(\"yo/lo\");\n    return __runtime.pop();\n  }).call(data);\n});\n",
      "type": "blob"
    },
    "test/builder": {
      "path": "test/builder",
      "content": "(function() {\n  var Builder;\n\n  global.require = require;\n\n  global.PACKAGE = PACKAGE;\n\n  Builder = require(\"../main\");\n\n  describe(\"Builder\", function() {\n    it(\"should exist\", function() {\n      return assert(Builder);\n    });\n    it(\"should build\", function() {\n      var builder, fileData;\n      builder = Builder();\n      fileData = Object.keys(PACKAGE.source).map(function(path) {\n        return PACKAGE.source[path];\n      });\n      return builder.build(fileData).then(function(result) {\n        return console.log(result);\n      }, function(errors) {\n        throw errors[0];\n      });\n    });\n    return it(\"should build haml\", function(done) {\n      var builder, fileData;\n      builder = Builder();\n      fileData = Object.keys(PACKAGE.source).map(function(path) {\n        return PACKAGE.source[path];\n      });\n      return builder.build(fileData).then(function(result) {\n        assert(result.distribution[\"_lib/hamljr_runtime\"].content);\n        assert(result.distribution[\"samples/haml\"].content);\n        return done();\n      }, function(errors) {\n        throw errors[0];\n      });\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    },
    "_lib/hamljr_runtime": {
      "path": "_lib/hamljr_runtime",
      "content": "(function() {\n  var Runtime, dataName, document,\n    __slice = [].slice;\n\n  dataName = \"__hamlJR_data\";\n\n  if (typeof window !== \"undefined\" && window !== null) {\n    document = window.document;\n  } else {\n    document = global.document;\n  }\n\n  Runtime = function(context) {\n    var append, bindObservable, classes, id, lastParent, observeAttribute, observeText, pop, push, render, self, stack, top;\n    stack = [];\n    lastParent = function() {\n      var element, i;\n      i = stack.length - 1;\n      while ((element = stack[i]) && element.nodeType === 11) {\n        i -= 1;\n      }\n      return element;\n    };\n    top = function() {\n      return stack[stack.length - 1];\n    };\n    append = function(child) {\n      var _ref;\n      if ((_ref = top()) != null) {\n        _ref.appendChild(child);\n      }\n      return child;\n    };\n    push = function(child) {\n      return stack.push(child);\n    };\n    pop = function() {\n      return append(stack.pop());\n    };\n    render = function(child) {\n      push(child);\n      return pop();\n    };\n    bindObservable = function(element, value, update) {\n      var observable, observe, unobserve;\n      if (typeof Observable === \"undefined\" || Observable === null) {\n        update(value);\n        return;\n      }\n      observable = Observable(value);\n      observe = function() {\n        observable.observe(update);\n        return update(observable());\n      };\n      unobserve = function() {\n        return observable.stopObserving(update);\n      };\n      element.addEventListener(\"DOMNodeInserted\", observe, true);\n      element.addEventListener(\"DOMNodeRemoved\", unobserve, true);\n      return element;\n    };\n    id = function() {\n      var element, sources, update, value;\n      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      element = top();\n      update = function(newValue) {\n        if (typeof newValue === \"function\") {\n          newValue = newValue();\n        }\n        return element.id = newValue;\n      };\n      value = function() {\n        var possibleValues;\n        possibleValues = sources.map(function(source) {\n          if (typeof source === \"function\") {\n            return source();\n          } else {\n            return source;\n          }\n        }).filter(function(idValue) {\n          return idValue != null;\n        });\n        return possibleValues[possibleValues.length - 1];\n      };\n      return bindObservable(element, value, update);\n    };\n    classes = function() {\n      var element, sources, update, value;\n      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      element = top();\n      update = function(newValue) {\n        if (typeof newValue === \"function\") {\n          newValue = newValue();\n        }\n        return element.className = newValue;\n      };\n      value = function() {\n        var possibleValues;\n        possibleValues = sources.map(function(source) {\n          if (typeof source === \"function\") {\n            return source();\n          } else {\n            return source;\n          }\n        }).filter(function(sourceValue) {\n          return sourceValue != null;\n        });\n        return possibleValues.join(\" \");\n      };\n      return bindObservable(element, value, update);\n    };\n    observeAttribute = function(name, value) {\n      var element, update;\n      element = top();\n      if ((name === \"value\") && (typeof value === \"function\")) {\n        element.value = value();\n        element.onchange = function() {\n          return value(element.value);\n        };\n        if (value.observe) {\n          value.observe(function(newValue) {\n            return element.value = newValue;\n          });\n        }\n      } else {\n        update = function(newValue) {\n          return element.setAttribute(name, newValue);\n        };\n        bindObservable(element, value, update);\n      }\n      return element;\n    };\n    observeText = function(value) {\n      var element, update;\n      switch (value != null ? value.nodeType : void 0) {\n        case 1:\n        case 3:\n        case 11:\n          render(value);\n          return;\n      }\n      element = document.createTextNode('');\n      update = function(newValue) {\n        return element.nodeValue = newValue;\n      };\n      bindObservable(element, value, update);\n      return render(element);\n    };\n    self = {\n      push: push,\n      pop: pop,\n      id: id,\n      classes: classes,\n      attribute: observeAttribute,\n      text: observeText,\n      filter: function(name, content) {},\n      each: function(items, fn) {\n        var elements, parent, replace;\n        items = Observable(items);\n        elements = [];\n        parent = lastParent();\n        items.observe(function(newItems) {\n          return replace(elements, newItems);\n        });\n        replace = function(oldElements, items) {\n          var firstElement;\n          if (oldElements) {\n            firstElement = oldElements[0];\n            parent = (firstElement != null ? firstElement.parentElement : void 0) || parent;\n            elements = items.map(function(item, index, array) {\n              var element;\n              element = fn.call(item, item, index, array);\n              element[dataName] = item;\n              parent.insertBefore(element, firstElement);\n              return element;\n            });\n            return oldElements.forEach(function(element) {\n              return element.remove();\n            });\n          } else {\n            return elements = items.map(function(item, index, array) {\n              var element;\n              element = fn.call(item, item, index, array);\n              element[dataName] = item;\n              return element;\n            });\n          }\n        };\n        return replace(null, items);\n      },\n      \"with\": function(item, fn) {\n        var element, replace, value;\n        element = null;\n        item = Observable(item);\n        item.observe(function(newValue) {\n          return replace(element, newValue);\n        });\n        value = item();\n        replace = function(oldElement, value) {\n          var parent;\n          element = fn.call(value);\n          element[dataName] = item;\n          if (oldElement) {\n            parent = oldElement.parentElement;\n            parent.insertBefore(element, oldElement);\n            return oldElement.remove();\n          } else {\n\n          }\n        };\n        return replace(element, value);\n      },\n      on: function(eventName, fn) {\n        var element;\n        element = lastParent();\n        if (eventName === \"change\") {\n          switch (element.nodeName) {\n            case \"SELECT\":\n              element[\"on\" + eventName] = function() {\n                var selectedOption;\n                selectedOption = this.options[this.selectedIndex];\n                return fn(selectedOption[dataName]);\n              };\n              if (fn.observe) {\n                return fn.observe(function(newValue) {\n                  return Array.prototype.forEach.call(element.options, function(option, index) {\n                    if (option[dataName] === newValue) {\n                      return element.selectedIndex = index;\n                    }\n                  });\n                });\n              }\n              break;\n            default:\n              element[\"on\" + eventName] = function() {\n                return fn(element.value);\n              };\n              if (fn.observe) {\n                return fn.observe(function(newValue) {\n                  return element.value = newValue;\n                });\n              }\n          }\n        } else {\n          return element[\"on\" + eventName] = function(event) {\n            return fn.call(context, event);\n          };\n        }\n      }\n    };\n    return self;\n  };\n\n  module.exports = Runtime;\n\n}).call(this);\n",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "version": "0.3.7",
  "entryPoint": "main",
  "remoteDependencies": [
    "https://code.jquery.com/jquery-1.10.1.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js"
  ],
  "repository": {
    "id": 14807528,
    "name": "builder",
    "full_name": "distri/builder",
    "owner": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
      "gravatar_id": "192f3f168409e79c42107f081139d9f3",
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
    "updated_at": "2014-04-07T00:43:53Z",
    "pushed_at": "2014-04-07T00:43:52Z",
    "git_url": "git://github.com/distri/builder.git",
    "ssh_url": "git@github.com:distri/builder.git",
    "clone_url": "https://github.com/distri/builder.git",
    "svn_url": "https://github.com/distri/builder",
    "homepage": null,
    "size": 504,
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
    "organization": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
      "gravatar_id": "192f3f168409e79c42107f081139d9f3",
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
    "publishBranch": "gh-pages"
  },
  "dependencies": {
    "cson": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "entryPoint: \"README\"\nversion: \"0.1.0\"\nremoteDependencies: [\n  \"https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"\n]\n",
          "type": "blob"
        },
        "README.coffee.md": {
          "path": "README.coffee.md",
          "mode": "100644",
          "content": "CSON\n====\n\nCoffeeScript Object Notation implemented in the hackiest way.\n\nOne downside is that it currently depends on the CoffeeScript compiler when it \nshould be a simple parser of its own.\n\n    module.exports =\n      parse: (source) ->\n        Function(\"return #{CoffeeScript.compile(source, bare: true)}\")()\n\nThis really needs to be improved. To do it correctly we'd need to detect\nobject/array values and indent while moving them to separate lines. Single\nvalues would exist without newlines or indentation. CSON.stringify would be\ncalled recursively.\n\nThe current hack of using JSON works because JSON is valid CSON.\n\nTODO: Escape keys that need it.\n\n      stringify: (object) ->\n        representation = JSON.parse(JSON.stringify(obj))\n\n        Object.keys(representation).map (key) ->\n          value = representation[key]\n          \"#{key}: #{JSON.stringify(value)}\"\n        .join(\"\\n\")\n",
          "type": "blob"
        },
        "test/cson.coffee": {
          "path": "test/cson.coffee",
          "mode": "100644",
          "content": "CSON = require \"../README\"\n\ndescribe \"CSON\", ->\n  it \"should parse\", ->\n    result = CSON.parse \"\"\"\n      hello: \"duder\"\n    \"\"\"\n\n    assert result.hello\n    assert.equal result.hello, \"duder\"\n\n  it \"should allow comments\", ->\n    result = CSON.parse \"\"\"\n      # Some comment\n      hey: \"yolo\" # Fo 'sho!\n    \"\"\"\n\n    assert.equal result.hey, \"yolo\"\n",
          "type": "blob"
        }
      },
      "distribution": {
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"entryPoint\":\"README\",\"version\":\"0.1.0\",\"remoteDependencies\":[\"https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"]};",
          "type": "blob"
        },
        "README": {
          "path": "README",
          "content": "(function() {\n  module.exports = {\n    parse: function(source) {\n      return Function(\"return \" + (CoffeeScript.compile(source, {\n        bare: true\n      })))();\n    },\n    stringify: function(object) {\n      var representation;\n      representation = JSON.parse(JSON.stringify(obj));\n      return Object.keys(representation).map(function(key) {\n        var value;\n        value = representation[key];\n        return \"\" + key + \": \" + (JSON.stringify(value));\n      }).join(\"\\n\");\n    }\n  };\n\n}).call(this);\n\n//# sourceURL=README.coffee",
          "type": "blob"
        },
        "test/cson": {
          "path": "test/cson",
          "content": "(function() {\n  var CSON;\n\n  CSON = require(\"../README\");\n\n  describe(\"CSON\", function() {\n    it(\"should parse\", function() {\n      var result;\n      result = CSON.parse(\"hello: \\\"duder\\\"\");\n      assert(result.hello);\n      return assert.equal(result.hello, \"duder\");\n    });\n    return it(\"should allow comments\", function() {\n      var result;\n      result = CSON.parse(\"# Some comment\\nhey: \\\"yolo\\\" # Fo 'sho!\");\n      return assert.equal(result.hey, \"yolo\");\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/cson.coffee",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.1.0",
      "entryPoint": "README",
      "remoteDependencies": [
        "https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js"
      ],
      "repository": {
        "id": 16653973,
        "name": "cson",
        "full_name": "distri/cson",
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
        "html_url": "https://github.com/distri/cson",
        "description": "CoffeeScript Object Notation implemented in the hackiest way.",
        "fork": false,
        "url": "https://api.github.com/repos/distri/cson",
        "forks_url": "https://api.github.com/repos/distri/cson/forks",
        "keys_url": "https://api.github.com/repos/distri/cson/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/cson/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/cson/teams",
        "hooks_url": "https://api.github.com/repos/distri/cson/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/cson/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/cson/events",
        "assignees_url": "https://api.github.com/repos/distri/cson/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/cson/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/cson/tags",
        "blobs_url": "https://api.github.com/repos/distri/cson/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/cson/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/cson/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/cson/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/cson/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/cson/languages",
        "stargazers_url": "https://api.github.com/repos/distri/cson/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/cson/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/cson/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/cson/subscription",
        "commits_url": "https://api.github.com/repos/distri/cson/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/cson/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/cson/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/cson/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/cson/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/cson/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/cson/merges",
        "archive_url": "https://api.github.com/repos/distri/cson/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/cson/downloads",
        "issues_url": "https://api.github.com/repos/distri/cson/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/cson/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/cson/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/cson/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/cson/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/cson/releases{/id}",
        "created_at": "2014-02-08T21:52:30Z",
        "updated_at": "2014-02-08T21:52:30Z",
        "pushed_at": "2014-02-08T21:52:30Z",
        "git_url": "git://github.com/distri/cson.git",
        "ssh_url": "git@github.com:distri/cson.git",
        "clone_url": "https://github.com/distri/cson.git",
        "svn_url": "https://github.com/distri/cson",
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
        "branch": "v0.1.0",
        "defaultBranch": "master"
      },
      "dependencies": {}
    },
    "haml-jr": {
      "source": {
        "LICENSE": {
          "path": "LICENSE",
          "mode": "100644",
          "content": "The MIT License (MIT)\n\nCopyright (c) 2014 \n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.",
          "type": "blob"
        },
        "README.md": {
          "path": "README.md",
          "mode": "100644",
          "content": "haml-jr\n=======\n\nHaml reborn. Pure HTML5 templating.\n\nRight now this is in a transitional state.\n\nMigrating from: https://github.com/STRd6/haml-jr\n\nCurrently our web based env dosen't build the lexer so the compiled products\nare in /lib for now.\n",
          "type": "blob"
        },
        "TODO.md": {
          "path": "TODO.md",
          "mode": "100644",
          "content": "TODO\n====\n\nFigure out the best way to have Observable included in the Runtime.\n\nAdd all the sample hamls to the tests.\n\nGet the lexer and parser to build from the web.\n",
          "type": "blob"
        },
        "compiler.coffee": {
          "path": "compiler.coffee",
          "mode": "100644",
          "content": "# TODO: We should have this as a real dependency one day\n# CoffeeScript = require \"coffee-script\"\n\nindentText = (text, indent=\"  \") ->\n  indent + text.replace(/\\n/g, \"\\n#{indent}\")\n\nkeywords = [\n  \"on\"\n  \"each\"\n  \"with\"\n]\n\nkeywordsRegex = RegExp(\"^\\\\s*(#{keywords.join('|')})\\\\s+\")\n\nutil =\n  indent: indentText\n\n  filters:\n    verbatim: (content, compiler) ->\n      # TODO: Allow \"\"\" in content to stand\n      compiler.buffer '\"\"\"' + content.replace(/(#)/, \"\\\\$1\") + '\"\"\"'\n\n    plain: (content, compiler) ->\n      compiler.buffer JSON.stringify(content)\n\n    coffeescript: (content, compiler) ->\n      [content]\n\n    javascript: (content, compiler) ->\n      [\n        \"`\"\n        compiler.indent(content)\n        \"`\"\n      ]\n\n  element: (tag, contents=[]) ->\n    lines = [\n      \"__runtime.push document.createElement(#{JSON.stringify(tag)})\"\n      contents...\n      \"__runtime.pop()\"\n    ]\n\n  buffer: (value) ->\n    [\n      \"__runtime.text #{value}\"\n    ]\n\n  attributes: (node) ->\n    {id, classes, attributes} = node\n\n    if id\n      ids = [JSON.stringify(id)]\n    else\n      ids = []\n\n    classes = (classes || []).map JSON.stringify\n\n    if attributes\n      attributes = attributes.filter ({name, value}) ->\n        if name is \"class\"\n          classes.push value\n\n          false\n        else if name is \"id\"\n          ids.push value\n\n          false\n        else\n          true\n\n    else\n      attributes = []\n\n    idsAndClasses = []\n\n    if ids.length\n      idsAndClasses.push \"__runtime.id #{ids.join(', ')}\"\n\n    if classes.length\n      idsAndClasses.push \"__runtime.classes #{classes.join(', ')}\"\n\n    attributeLines = attributes.map ({name, value}) ->\n      name = JSON.stringify(name)\n\n      \"\"\"\n        __runtime.attribute #{name}, #{value}\n      \"\"\"\n\n    return idsAndClasses.concat attributeLines\n\n  render: (node) ->\n    {tag, filter, text} = node\n\n    if tag\n      @tag(node)\n    else if filter\n      @filter(node)\n    else\n      @contents(node)\n\n  replaceKeywords: (codeString) ->\n    codeString.replace(keywordsRegex, \"__runtime.$1 \")\n\n  filter: (node) ->\n    filterName = node.filter\n\n    if filter = @filters[filterName]\n      [].concat.apply([], @filters[filterName](node.content, this))\n    else\n      [\n        \"__runtime.filter(#{JSON.stringify(filterName)}, #{JSON.stringify(node.content)})\"\n      ]\n\n  contents: (node) ->\n    {children, bufferedCode, unbufferedCode, text} = node\n\n    if unbufferedCode\n      indent = true\n      code = @replaceKeywords(unbufferedCode)\n\n      contents = [code]\n    else if bufferedCode\n      contents = @buffer(bufferedCode)\n    else if text\n      contents = @buffer(JSON.stringify(text))\n    else if node.tag\n      contents = []\n    else if node.comment\n      # TODO: Create comment nodes\n      return []\n    else\n      contents = []\n      console.warn \"No content for node:\", node\n\n    if children\n      childContent = @renderNodes(children)\n\n      if indent\n        childContent = @indent(childContent.join(\"\\n\"))\n\n      contents = contents.concat(childContent)\n\n    return @attributes(node).concat contents\n\n  renderNodes: (nodes) ->\n    [].concat.apply([], nodes.map(@render, this))\n\n  tag: (node) ->\n    {tag} = node\n\n    @element tag, @contents(node)\n\nexports.compile = (parseTree, {compiler}={}) ->\n  compiler ?= CoffeeScript\n\n  items = util.renderNodes(parseTree)\n\n  source = \"\"\"\n    (data) ->\n      (->\n        __runtime = Runtime(this)\n\n        __runtime.push document.createDocumentFragment()\n    #{util.indent(items.join(\"\\n\"), \"    \")}\n        __runtime.pop()\n      ).call(data)\n  \"\"\"\n\n  options = bare: true\n  programSource = source\n\n  program = compiler.compile programSource, options\n\n  return program\n",
          "type": "blob"
        },
        "demo.coffee.md": {
          "path": "demo.coffee.md",
          "mode": "100644",
          "content": "Haml Jr Demo\n============\n\nHaml Jr is a templating language for JavaScript. It's like Backbone or Knockout,\nexcept not awful.\n\nSimple HTML\n-------\n\n>     #! demo\n>     template = \"\"\"\n>       %h1 Radical\n>       %hr\n>       %p Hello duder.\n>     \"\"\"\n\n---\n\nMultiple Bindings\n-----------------\n\n>     #! demo\n>     template = \"\"\"\n>       %input(type=\"text\" value=@value)\n>       %hr\n>       %input(type=\"range\" value=@value min=\"1\" max=@max)\n>       %hr\n>       %progress(value=@value max=@max)\n>     \"\"\"\n>     model =\n>       max: 100\n>       value: Observable 5\n\n---\n\nDependent Functions\n-------------------\n\n>     #! demo\n>     template = \"\"\"\n>       %h2= @name\n>       %input(value=@first)\n>       %input(value=@last)\n>     \"\"\"\n>\n>     first = Observable(\"Mr.\")\n>     last = Observable(\"Duderman\")\n>\n>     model =\n>       name: ->\n>         first() + \" \" + last()\n>       first: first\n>       last: last\n\n---\n\nInteractive Runtime\n-------------------\n\n>     #! setup\n>     require \"/interactive\"\n",
          "type": "blob"
        },
        "haml-jr.coffee": {
          "path": "haml-jr.coffee",
          "mode": "100644",
          "content": "{compile} = require \"./compiler\"\n{lexer} = require \"./lib/lexer\"\n{parser} = require \"./lib/parser\"\n\nextend = (target, sources...) ->\n  for source in sources\n    for name of source\n      target[name] = source[name]\n\n  return target\n\noldParse = parser.parse\nextend parser,\n  lexer: lexer\n  parse: (input) ->\n    # Initialize shared state for gross hacks\n    extend parser.yy,\n      indent: 0\n      nodePath: [{children: []}]\n      filterIndent: undefined\n\n    return oldParse.call(parser, input)\n\nextend parser.yy,\n  extend: extend\n\n  newline: ->\n    lastNode = @nodePath[@nodePath.length - 1]\n\n    # TODO: Add newline nodes to tree to maintain\n    # spacing\n\n    if lastNode.filter\n      @appendFilterContent(lastNode, \"\")\n\n  append: (node, indentation=0) ->\n    if node.filterLine\n      lastNode = @nodePath[@nodePath.length - 1]\n      @appendFilterContent(lastNode, node.filterLine)\n\n      return\n\n    parent = @nodePath[indentation]\n    @appendChild parent, node\n\n    index = indentation + 1\n    @nodePath[index] = node\n    @nodePath.length = index + 1\n\n    return node\n\n  appendChild: (parent, child) ->\n    unless child.filter\n      @filterIndent = undefined\n      # Resetting back to initial state so we can handle\n      # back to back filters\n      @lexer.popState()\n\n    parent.children ||= []\n    parent.children.push child\n\n  appendFilterContent: (filter, content) ->\n    filter.content ||= \"\"\n    filter.content += \"#{content}\\n\"\n\nextend exports,\n  compile: (input, options) ->\n    if typeof input is \"string\"\n      input = parser.parse(input + \"\\n\")\n\n    return compile(input, options)\n  parser: parser\n",
          "type": "blob"
        },
        "interactive.coffee.md": {
          "path": "interactive.coffee.md",
          "mode": "100644",
          "content": "Interactive Runtime for Docs\n============================\n\n    HamlJr = require \"./haml-jr\"\n\n    # TODO: Update Runtime to not need global Observable\n    global.Observable = require \"observable\"\n    global.Runtime = require \"./runtime\"\n\n    # {applyStylesheet, CSON} = require \"./lib/util\"\n    # applyStylesheet require \"./style/demo\"\n\n    # TODO: Textarea for template, text area for data, live interactive demo\n    # Changing data reloads the new data into the same template\n    # Changing template reloads the same data into the new template\n\n    Interactive.register \"demo\", ({source, runtimeElement}) ->\n      code =\n        \"var template, model;\" +\n        CoffeeScript.compile(source, bare: true)\n\n      code += \"\\nreturn [template, model];\"\n\n      [template, model] = Function(\"Observable\", code)(Observable)\n\n      view = Function(\"return \" + HamlJr.compile(template))()\n\n      runtimeElement.empty().append view(model)\n",
          "type": "blob"
        },
        "lib/lexer.js": {
          "path": "lib/lexer.js",
          "mode": "100644",
          "content": "var lexer=function(){var lexer={EOF:1,parseError:function parseError(str,hash){if(this.yy.parser){this.yy.parser.parseError(str,hash)}else{throw new Error(str)}},setInput:function(input){this._input=input;this._more=this._backtrack=this.done=false;this.yylineno=this.yyleng=0;this.yytext=this.matched=this.match=\"\";this.conditionStack=[\"INITIAL\"];this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0};if(this.options.ranges){this.yylloc.range=[0,0]}this.offset=0;return this},input:function(){var ch=this._input[0];this.yytext+=ch;this.yyleng++;this.offset++;this.match+=ch;this.matched+=ch;var lines=ch.match(/(?:\\r\\n?|\\n).*/g);if(lines){this.yylineno++;this.yylloc.last_line++}else{this.yylloc.last_column++}if(this.options.ranges){this.yylloc.range[1]++}this._input=this._input.slice(1);return ch},unput:function(ch){var len=ch.length;var lines=ch.split(/(?:\\r\\n?|\\n)/g);this._input=ch+this._input;this.yytext=this.yytext.substr(0,this.yytext.length-len-1);this.offset-=len;var oldLines=this.match.split(/(?:\\r\\n?|\\n)/g);this.match=this.match.substr(0,this.match.length-1);this.matched=this.matched.substr(0,this.matched.length-1);if(lines.length-1){this.yylineno-=lines.length-1}var r=this.yylloc.range;this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:lines?(lines.length===oldLines.length?this.yylloc.first_column:0)+oldLines[oldLines.length-lines.length].length-lines[0].length:this.yylloc.first_column-len};if(this.options.ranges){this.yylloc.range=[r[0],r[0]+this.yyleng-len]}this.yyleng=this.yytext.length;return this},more:function(){this._more=true;return this},reject:function(){if(this.options.backtrack_lexer){this._backtrack=true}else{return this.parseError(\"Lexical error on line \"+(this.yylineno+1)+\". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\\n\"+this.showPosition(),{text:\"\",token:null,line:this.yylineno})}return this},less:function(n){this.unput(this.match.slice(n))},pastInput:function(){var past=this.matched.substr(0,this.matched.length-this.match.length);return(past.length>20?\"...\":\"\")+past.substr(-20).replace(/\\n/g,\"\")},upcomingInput:function(){var next=this.match;if(next.length<20){next+=this._input.substr(0,20-next.length)}return(next.substr(0,20)+(next.length>20?\"...\":\"\")).replace(/\\n/g,\"\")},showPosition:function(){var pre=this.pastInput();var c=new Array(pre.length+1).join(\"-\");return pre+this.upcomingInput()+\"\\n\"+c+\"^\"},test_match:function(match,indexed_rule){var token,lines,backup;if(this.options.backtrack_lexer){backup={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done};if(this.options.ranges){backup.yylloc.range=this.yylloc.range.slice(0)}}lines=match[0].match(/(?:\\r\\n?|\\n).*/g);if(lines){this.yylineno+=lines.length}this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:lines?lines[lines.length-1].length-lines[lines.length-1].match(/\\r?\\n?/)[0].length:this.yylloc.last_column+match[0].length};this.yytext+=match[0];this.match+=match[0];this.matches=match;this.yyleng=this.yytext.length;if(this.options.ranges){this.yylloc.range=[this.offset,this.offset+=this.yyleng]}this._more=false;this._backtrack=false;this._input=this._input.slice(match[0].length);this.matched+=match[0];token=this.performAction.call(this,this.yy,this,indexed_rule,this.conditionStack[this.conditionStack.length-1]);if(this.done&&this._input){this.done=false}if(token){return token}else if(this._backtrack){for(var k in backup){this[k]=backup[k]}return false}return false},next:function(){if(this.done){return this.EOF}if(!this._input){this.done=true}var token,match,tempMatch,index;if(!this._more){this.yytext=\"\";this.match=\"\"}var rules=this._currentRules();for(var i=0;i<rules.length;i++){tempMatch=this._input.match(this.rules[rules[i]]);if(tempMatch&&(!match||tempMatch[0].length>match[0].length)){match=tempMatch;index=i;if(this.options.backtrack_lexer){token=this.test_match(tempMatch,rules[i]);if(token!==false){return token}else if(this._backtrack){match=false;continue}else{return false}}else if(!this.options.flex){break}}}if(match){token=this.test_match(match,rules[index]);if(token!==false){return token}return false}if(this._input===\"\"){return this.EOF}else{return this.parseError(\"Lexical error on line \"+(this.yylineno+1)+\". Unrecognized text.\\n\"+this.showPosition(),{text:\"\",token:null,line:this.yylineno})}},lex:function lex(){var r=this.next();if(r){return r}else{return this.lex()}},begin:function begin(condition){this.conditionStack.push(condition)},popState:function popState(){var n=this.conditionStack.length-1;if(n>0){return this.conditionStack.pop()}else{return this.conditionStack[0]}},_currentRules:function _currentRules(){if(this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules}else{return this.conditions[\"INITIAL\"].rules}},topState:function topState(n){n=this.conditionStack.length-1-Math.abs(n||0);if(n>=0){return this.conditionStack[n]}else{return\"INITIAL\"}},pushState:function pushState(condition){this.begin(condition)},stateStackSize:function stateStackSize(){return this.conditionStack.length},options:{moduleName:\"lexer\"},performAction:function anonymous(yy,yy_,$avoiding_name_collisions,YY_START){var YYSTATE=YY_START;switch($avoiding_name_collisions){case 0:this.popState();return\"RIGHT_BRACE\";break;case 1:yy_.yytext=yy_.yytext.substring(1);return\"ATTRIBUTE\";break;case 2:this.begin(\"brace_value\");return\"EQUAL\";break;case 3:return\"SEPARATOR\";break;case 4:return\"TEXT\";break;case 5:this.popState();return\"ATTRIBUTE_VALUE\";break;case 6:this.popState();return\"ATTRIBUTE_VALUE\";break;case 7:return\"SEPARATOR\";break;case 8:this.popState();return\"RIGHT_PARENTHESIS\";break;case 9:return\"ATTRIBUTE\";break;case 10:this.begin(\"value\");return\"EQUAL\";break;case 11:this.popState();return\"ATTRIBUTE_VALUE\";break;case 12:this.popState();return\"ATTRIBUTE_VALUE\";break;case 13:this.popState();return\"ATTRIBUTE_VALUE\";break;case 14:yy.indent=0;this.popState();return\"NEWLINE\";break;case 15:return\"FILTER_LINE\";break;case 16:yy.indent=0;return\"NEWLINE\";break;case 17:yy.indent+=1;if(yy.indent>yy.filterIndent){this.begin(\"filter\")};return\"INDENT\";break;case 18:this.begin(\"parentheses_attributes\");return\"LEFT_PARENTHESIS\";break;case 19:this.begin(\"brace_attributes\");return\"LEFT_BRACE\";break;case 20:yy_.yytext=yy_.yytext.substring(1);return\"COMMENT\";break;case 21:yy.filterIndent=yy.indent;yy_.yytext=yy_.yytext.substring(1);return\"FILTER\";break;case 22:yy_.yytext=yy_.yytext.substring(1);return\"ID\";break;case 23:yy_.yytext=yy_.yytext.substring(1);return\"CLASS\";break;case 24:yy_.yytext=yy_.yytext.substring(1);return\"TAG\";break;case 25:yy_.yytext=yy_.yytext.substring(1).trim();return\"BUFFERED_CODE\";break;case 26:yy_.yytext=yy_.yytext.substring(1).trim();return\"UNBUFFERED_CODE\";break;case 27:yy_.yytext=yy_.yytext.trimLeft();return\"TEXT\";break}},rules:[/^(?:\\})/,/^(?::([_a-zA-Z][-_a-zA-Z0-9]*))/,/^(?:[ \\t]*=>[ \\t])/,/^(?:,[ \\t]*)/,/^(?:[^\\}]*)/,/^(?:\"(\\\\.|[^\\\\\"])*\")/,/^(?:[^ \\t\\}]*)/,/^(?:[ \\t]+)/,/^(?:\\))/,/^(?:([_a-zA-Z][-_a-zA-Z0-9]*))/,/^(?:=)/,/^(?:\"(\\\\.|[^\\\\\"])*\")/,/^(?:'(\\\\.|[^\\\\'])*')/,/^(?:[^ \\t\\)]*)/,/^(?:(\\n|$))/,/^(?:[^\\n]*)/,/^(?:\\s*(\\n|$))/,/^(?:  )/,/^(?:\\()/,/^(?:\\{)/,/^(?:\\/.*)/,/^(?::([_a-zA-Z][-_a-zA-Z0-9]*))/,/^(?:#((:|[A-Z]|_|[a-z])((:|[A-Z]|_|[a-z])|-|[0-9])*(?!-)))/,/^(?:\\.((:|[A-Z]|_|[a-z])((:|[A-Z]|_|[a-z])|-|[0-9])*(?!-)))/,/^(?:%((:|[A-Z]|_|[a-z])((:|[A-Z]|_|[a-z])|-|[0-9])*(?!-)))/,/^(?:=.*)/,/^(?:-.*)/,/^(?:.*)/],conditions:{filter:{rules:[14,15],inclusive:false},value:{rules:[11,12,13],inclusive:false},parentheses_attributes:{rules:[7,8,9,10],inclusive:false},brace_value:{rules:[5,6],inclusive:false},brace_attributes:{rules:[0,1,2,3,4],inclusive:false},INITIAL:{rules:[16,17,18,19,20,21,22,23,24,25,26,27],inclusive:true}}};return lexer}();exports.lexer=lexer;",
          "type": "blob"
        },
        "lib/parser.js": {
          "path": "lib/parser.js",
          "mode": "100644",
          "content": "var parser=function(){var parser={trace:function trace(){},yy:{},symbols_:{error:2,root:3,lines:4,line:5,indentation:6,indentationLevel:7,INDENT:8,lineMain:9,end:10,tag:11,rest:12,COMMENT:13,FILTER:14,FILTER_LINE:15,NEWLINE:16,name:17,tagComponents:18,attributes:19,idComponent:20,classComponents:21,ID:22,CLASS:23,LEFT_PARENTHESIS:24,attributePairs:25,RIGHT_PARENTHESIS:26,LEFT_BRACE:27,RIGHT_BRACE:28,SEPARATOR:29,attributePair:30,ATTRIBUTE:31,EQUAL:32,ATTRIBUTE_VALUE:33,TAG:34,BUFFERED_CODE:35,UNBUFFERED_CODE:36,TEXT:37,$accept:0,$end:1},terminals_:{2:\"error\",8:\"INDENT\",13:\"COMMENT\",14:\"FILTER\",15:\"FILTER_LINE\",16:\"NEWLINE\",22:\"ID\",23:\"CLASS\",24:\"LEFT_PARENTHESIS\",26:\"RIGHT_PARENTHESIS\",27:\"LEFT_BRACE\",28:\"RIGHT_BRACE\",29:\"SEPARATOR\",31:\"ATTRIBUTE\",32:\"EQUAL\",33:\"ATTRIBUTE_VALUE\",34:\"TAG\",35:\"BUFFERED_CODE\",36:\"UNBUFFERED_CODE\",37:\"TEXT\"},productions_:[0,[3,1],[4,2],[4,1],[6,0],[6,1],[7,2],[7,1],[5,3],[5,1],[9,2],[9,1],[9,1],[9,1],[9,1],[9,1],[10,1],[11,2],[11,2],[11,1],[11,1],[18,3],[18,2],[18,2],[18,2],[18,1],[18,1],[20,1],[21,2],[21,1],[19,3],[19,3],[25,3],[25,1],[30,3],[17,1],[12,1],[12,1],[12,1]],performAction:function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$){var $0=$$.length-1;switch(yystate){case 1:return this.$=yy.nodePath[0].children;break;case 2:this.$=$$[$0-1];break;case 3:this.$=$$[$0];break;case 4:this.$=0;break;case 5:this.$=$$[$0];break;case 6:this.$=$$[$0-1]+1;break;case 7:this.$=1;break;case 8:this.$=yy.append($$[$0-1],$$[$0-2]);break;case 9:this.$=function(){if($$[$0].newline){return yy.newline()}}();break;case 10:this.$=yy.extend($$[$0-1],$$[$0]);break;case 11:this.$=$$[$0];break;case 12:this.$=$$[$0];break;case 13:this.$={comment:$$[$0]};break;case 14:this.$={filter:$$[$0]};break;case 15:this.$={filterLine:$$[$0]};break;case 16:this.$={newline:true};break;case 17:this.$=function(){$$[$0].tag=$$[$0-1];return $$[$0]}();break;case 18:this.$={tag:$$[$0-1],attributes:$$[$0]};break;case 19:this.$={tag:$$[$0]};break;case 20:this.$=yy.extend($$[$0],{tag:\"div\"});break;case 21:this.$={id:$$[$0-2],classes:$$[$0-1],attributes:$$[$0]};break;case 22:this.$={id:$$[$0-1],attributes:$$[$0]};break;case 23:this.$={classes:$$[$0-1],attributes:$$[$0]};break;case 24:this.$={id:$$[$0-1],classes:$$[$0]};break;case 25:this.$={id:$$[$0]};break;case 26:this.$={classes:$$[$0]};break;case 27:this.$=$$[$0];break;case 28:this.$=$$[$0-1].concat($$[$0]);break;case 29:this.$=[$$[$0]];break;case 30:this.$=$$[$0-1];break;case 31:this.$=$$[$0-1];break;case 32:this.$=$$[$0-2].concat($$[$0]);break;case 33:this.$=[$$[$0]];break;case 34:this.$={name:$$[$0-2],value:$$[$0]};break;case 35:this.$=$$[$0];break;case 36:this.$={bufferedCode:$$[$0]};break;case 37:this.$={unbufferedCode:$$[$0]};break;case 38:this.$={text:$$[$0]+\"\\n\"};break}},table:[{3:1,4:2,5:3,6:4,7:6,8:[1,8],10:5,13:[2,4],14:[2,4],15:[2,4],16:[1,7],22:[2,4],23:[2,4],34:[2,4],35:[2,4],36:[2,4],37:[2,4]},{1:[3]},{1:[2,1],5:9,6:4,7:6,8:[1,8],10:5,13:[2,4],14:[2,4],15:[2,4],16:[1,7],22:[2,4],23:[2,4],34:[2,4],35:[2,4],36:[2,4],37:[2,4]},{1:[2,3],8:[2,3],13:[2,3],14:[2,3],15:[2,3],16:[2,3],22:[2,3],23:[2,3],34:[2,3],35:[2,3],36:[2,3],37:[2,3]},{9:10,11:11,12:12,13:[1,13],14:[1,14],15:[1,15],17:16,18:17,20:22,21:23,22:[1,24],23:[1,25],34:[1,21],35:[1,18],36:[1,19],37:[1,20]},{1:[2,9],8:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[2,9],22:[2,9],23:[2,9],34:[2,9],35:[2,9],36:[2,9],37:[2,9]},{8:[1,26],13:[2,5],14:[2,5],15:[2,5],22:[2,5],23:[2,5],34:[2,5],35:[2,5],36:[2,5],37:[2,5]},{1:[2,16],8:[2,16],13:[2,16],14:[2,16],15:[2,16],16:[2,16],22:[2,16],23:[2,16],34:[2,16],35:[2,16],36:[2,16],37:[2,16]},{8:[2,7],13:[2,7],14:[2,7],15:[2,7],22:[2,7],23:[2,7],34:[2,7],35:[2,7],36:[2,7],37:[2,7]},{1:[2,2],8:[2,2],13:[2,2],14:[2,2],15:[2,2],16:[2,2],22:[2,2],23:[2,2],34:[2,2],35:[2,2],36:[2,2],37:[2,2]},{10:27,16:[1,7]},{12:28,16:[2,11],35:[1,18],36:[1,19],37:[1,20]},{16:[2,12]},{16:[2,13]},{16:[2,14]},{16:[2,15]},{16:[2,19],18:29,19:30,20:22,21:23,22:[1,24],23:[1,25],24:[1,31],27:[1,32],35:[2,19],36:[2,19],37:[2,19]},{16:[2,20],35:[2,20],36:[2,20],37:[2,20]},{16:[2,36]},{16:[2,37]},{16:[2,38]},{16:[2,35],22:[2,35],23:[2,35],24:[2,35],27:[2,35],35:[2,35],36:[2,35],37:[2,35]},{16:[2,25],19:34,21:33,23:[1,25],24:[1,31],27:[1,32],35:[2,25],36:[2,25],37:[2,25]},{16:[2,26],19:35,23:[1,36],24:[1,31],27:[1,32],35:[2,26],36:[2,26],37:[2,26]},{16:[2,27],23:[2,27],24:[2,27],27:[2,27],35:[2,27],36:[2,27],37:[2,27]},{16:[2,29],23:[2,29],24:[2,29],27:[2,29],35:[2,29],36:[2,29],37:[2,29]},{8:[2,6],13:[2,6],14:[2,6],15:[2,6],22:[2,6],23:[2,6],34:[2,6],35:[2,6],36:[2,6],37:[2,6]},{1:[2,8],8:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[2,8],22:[2,8],23:[2,8],34:[2,8],35:[2,8],36:[2,8],37:[2,8]},{16:[2,10]},{16:[2,17],35:[2,17],36:[2,17],37:[2,17]},{16:[2,18],35:[2,18],36:[2,18],37:[2,18]},{25:37,30:38,31:[1,39]},{25:40,30:38,31:[1,39]},{16:[2,24],19:41,23:[1,36],24:[1,31],27:[1,32],35:[2,24],36:[2,24],37:[2,24]},{16:[2,22],35:[2,22],36:[2,22],37:[2,22]},{16:[2,23],35:[2,23],36:[2,23],37:[2,23]},{16:[2,28],23:[2,28],24:[2,28],27:[2,28],35:[2,28],36:[2,28],37:[2,28]},{26:[1,42],29:[1,43]},{26:[2,33],28:[2,33],29:[2,33]},{32:[1,44]},{28:[1,45],29:[1,43]},{16:[2,21],35:[2,21],36:[2,21],37:[2,21]},{16:[2,30],35:[2,30],36:[2,30],37:[2,30]},{30:46,31:[1,39]},{33:[1,47]},{16:[2,31],35:[2,31],36:[2,31],37:[2,31]},{26:[2,32],28:[2,32],29:[2,32]},{26:[2,34],28:[2,34],29:[2,34]}],defaultActions:{12:[2,12],13:[2,13],14:[2,14],15:[2,15],18:[2,36],19:[2,37],20:[2,38],28:[2,10]},parseError:function parseError(str,hash){if(hash.recoverable){this.trace(str)}else{throw new Error(str)}},parse:function parse(input){var self=this,stack=[0],vstack=[null],lstack=[],table=this.table,yytext=\"\",yylineno=0,yyleng=0,recovering=0,TERROR=2,EOF=1;this.lexer.setInput(input);this.lexer.yy=this.yy;this.yy.lexer=this.lexer;this.yy.parser=this;if(typeof this.lexer.yylloc==\"undefined\"){this.lexer.yylloc={}}var yyloc=this.lexer.yylloc;lstack.push(yyloc);var ranges=this.lexer.options&&this.lexer.options.ranges;if(typeof this.yy.parseError===\"function\"){this.parseError=this.yy.parseError}else{this.parseError=Object.getPrototypeOf(this).parseError}function popStack(n){stack.length=stack.length-2*n;vstack.length=vstack.length-n;lstack.length=lstack.length-n}function lex(){var token;token=self.lexer.lex()||EOF;if(typeof token!==\"number\"){token=self.symbols_[token]||token}return token}var symbol,preErrorSymbol,state,action,a,r,yyval={},p,len,newState,expected;while(true){state=stack[stack.length-1];if(this.defaultActions[state]){action=this.defaultActions[state]}else{if(symbol===null||typeof symbol==\"undefined\"){symbol=lex()}action=table[state]&&table[state][symbol]}if(typeof action===\"undefined\"||!action.length||!action[0]){var errStr=\"\";expected=[];for(p in table[state]){if(this.terminals_[p]&&p>TERROR){expected.push(\"'\"+this.terminals_[p]+\"'\")}}if(this.lexer.showPosition){errStr=\"Parse error on line \"+(yylineno+1)+\":\\n\"+this.lexer.showPosition()+\"\\nExpecting \"+expected.join(\", \")+\", got '\"+(this.terminals_[symbol]||symbol)+\"'\"}else{errStr=\"Parse error on line \"+(yylineno+1)+\": Unexpected \"+(symbol==EOF?\"end of input\":\"'\"+(this.terminals_[symbol]||symbol)+\"'\")}this.parseError(errStr,{text:this.lexer.match,token:this.terminals_[symbol]||symbol,line:this.lexer.yylineno,loc:yyloc,expected:expected})}if(action[0]instanceof Array&&action.length>1){throw new Error(\"Parse Error: multiple actions possible at state: \"+state+\", token: \"+symbol)}switch(action[0]){case 1:stack.push(symbol);vstack.push(this.lexer.yytext);lstack.push(this.lexer.yylloc);stack.push(action[1]);symbol=null;if(!preErrorSymbol){yyleng=this.lexer.yyleng;yytext=this.lexer.yytext;yylineno=this.lexer.yylineno;yyloc=this.lexer.yylloc;if(recovering>0){recovering--}}else{symbol=preErrorSymbol;preErrorSymbol=null}break;case 2:len=this.productions_[action[1]][1];yyval.$=vstack[vstack.length-len];yyval._$={first_line:lstack[lstack.length-(len||1)].first_line,last_line:lstack[lstack.length-1].last_line,first_column:lstack[lstack.length-(len||1)].first_column,last_column:lstack[lstack.length-1].last_column};if(ranges){yyval._$.range=[lstack[lstack.length-(len||1)].range[0],lstack[lstack.length-1].range[1]]}r=this.performAction.call(yyval,yytext,yyleng,yylineno,this.yy,action[1],vstack,lstack);if(typeof r!==\"undefined\"){return r}if(len){stack=stack.slice(0,-1*len*2);vstack=vstack.slice(0,-1*len);lstack=lstack.slice(0,-1*len)}stack.push(this.productions_[action[1]][0]);vstack.push(yyval.$);lstack.push(yyval._$);newState=table[stack[stack.length-2]][stack[stack.length-1]];stack.push(newState);break;case 3:return true}}return true}};undefined;function Parser(){this.yy={}}Parser.prototype=parser;parser.Parser=Parser;return new Parser}();if(typeof require!==\"undefined\"&&typeof exports!==\"undefined\"){exports.parser=parser;exports.Parser=parser.Parser;exports.parse=function(){return parser.parse.apply(parser,arguments)};exports.main=function commonjsMain(args){if(!args[1]){console.log(\"Usage: \"+args[0]+\" FILE\");process.exit(1)}var source=require(\"fs\").readFileSync(require(\"path\").normalize(args[1]),\"utf8\");return exports.parser.parse(source)};if(typeof module!==\"undefined\"&&require.main===module){exports.main(process.argv.slice(1))}}",
          "type": "blob"
        },
        "lib/util.coffee.md": {
          "path": "lib/util.coffee.md",
          "mode": "100644",
          "content": "Util\n====\n\n    module.exports =\n      CSON:\n        parse: (source) ->\n          Function(\"return #{CoffeeScript.compile(source, bare: true)}\")()\n\n      applyStylesheet: (style, id=\"primary\") ->\n        styleNode = document.createElement(\"style\")\n        styleNode.innerHTML = style\n        styleNode.id = id\n\n        if previousStyleNode = document.head.querySelector(\"style##{id}\")\n          previousStyleNode.parentNode.removeChild(prevousStyleNode)\n\n        document.head.appendChild(styleNode)\n",
          "type": "blob"
        },
        "pixie.cson": {
          "path": "pixie.cson",
          "mode": "100644",
          "content": "version: \"0.2.1\"\nentryPoint: \"haml-jr\"\nremoteDependencies: [\n  \"https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"\n]\ndependencies:\n  observable: \"distri/observable:v0.1.0\"\n",
          "type": "blob"
        },
        "runtime.coffee.md": {
          "path": "runtime.coffee.md",
          "mode": "100644",
          "content": "Runtime\n=======\n\nThis runtime component is all you need to render compiled HamlJr templates.\n\n    dataName = \"__hamlJR_data\"\n\n    if window?\n      document = window.document\n    else\n      document = global.document\n\n    Runtime = (context) ->\n      stack = []\n\n      # HAX: A document fragment is not your real dad\n      lastParent = ->\n        i = stack.length - 1\n        while (element = stack[i]) and element.nodeType is 11\n          i -= 1\n\n        element\n\n      top = ->\n        stack[stack.length-1]\n\n      append = (child) ->\n        top()?.appendChild(child)\n\n        return child\n\n      push = (child) ->\n        stack.push(child)\n\n      pop = ->\n        append(stack.pop())\n\n      render = (child) ->\n        push(child)\n        pop()\n\n      bindObservable = (element, value, update) ->\n        # CLI short-circuits here because it doesn't do observables\n        unless Observable?\n          update(value)\n          return\n\n        observable = Observable(value)\n\n        observe = ->\n          observable.observe update\n          update observable()\n\n        unobserve = ->\n          observable.stopObserving update\n\n        element.addEventListener(\"DOMNodeInserted\", observe, true)\n        element.addEventListener(\"DOMNodeRemoved\", unobserve, true)\n\n        return element\n\n      id = (sources...) ->\n        element = top()\n\n        update = (newValue) ->\n          # HACK: Working around CLI not having observables\n          if typeof newValue is \"function\"\n            newValue = newValue()\n\n          element.id = newValue\n\n        value = ->\n          possibleValues = sources.map (source) ->\n            if typeof source is \"function\"\n              source()\n            else\n              source\n          .filter (idValue) ->\n            idValue?\n\n          possibleValues[possibleValues.length-1]\n\n        bindObservable(element, value, update)\n\n      classes = (sources...) ->\n        element = top()\n\n        update = (newValue) ->\n          # HACK: Working around CLI not having observables\n          if typeof newValue is \"function\"\n            newValue = newValue()\n\n          element.className = newValue\n\n        value = ->\n          possibleValues = sources.map (source) ->\n            if typeof source is \"function\"\n              source()\n            else\n              source\n          .filter (sourceValue) ->\n            sourceValue?\n\n          possibleValues.join(\" \")\n\n        bindObservable(element, value, update)\n\n      observeAttribute = (name, value) ->\n        element = top()\n\n        if (name is \"value\") and (typeof value is \"function\")\n          element.value = value()\n\n          element.onchange = ->\n            value(element.value)\n\n          if value.observe\n            value.observe (newValue) ->\n              element.value = newValue\n        else\n          update = (newValue) ->\n            element.setAttribute name, newValue\n\n          bindObservable(element, value, update)\n\n        return element\n\n      observeText = (value) ->\n        # Kind of a hack for handling sub renders\n        # or adding explicit html nodes to the output\n        # TODO: May want to make more sure that it's a real dom node\n        #       and not some other object with a nodeType property\n        # TODO: This shouldn't be inside of the observeText method\n        switch value?.nodeType\n          when 1, 3, 11\n            render(value)\n            return\n\n        # HACK: We don't really want to know about the document inside here.\n        # Creating our text nodes in here cleans up the external call\n        # so it may be worth it.\n        element = document.createTextNode('')\n\n        update = (newValue) ->\n          element.nodeValue = newValue\n\n        bindObservable element, value, update\n\n        render element\n\n      self =\n        # Pushing and popping creates the node tree\n        push: push\n        pop: pop\n\n        id: id\n        classes: classes\n        attribute: observeAttribute\n        text: observeText\n\n        filter: (name, content) ->\n          ; # TODO self.filters[name](content)\n\n        each: (items, fn) ->\n          items = Observable(items)\n          elements = []\n          parent = lastParent()\n\n          # TODO: Work when rendering many sibling elements\n          items.observe (newItems) ->\n            replace elements, newItems\n\n          replace = (oldElements, items) ->\n            if oldElements\n              # TODO: There a lot of trouble if we can't find a parent\n              # We may be able to hack around it by observing when\n              # we're inserted into the dom and finding out what parent element\n              # we have\n              firstElement = oldElements[0]\n              parent = firstElement?.parentElement || parent\n\n              elements = items.map (item, index, array) ->\n                element = fn.call(item, item, index, array)\n                element[dataName] = item\n\n                parent.insertBefore element, firstElement\n\n                return element\n\n              oldElements.forEach (element) ->\n                element.remove()\n            else\n              elements = items.map (item, index, array) ->\n                element = fn.call(item, item, index, array)\n                element[dataName] = item\n\n                return element\n\n          replace(null, items)\n\n        with: (item, fn) ->\n          element = null\n\n          item = Observable(item)\n\n          item.observe (newValue) ->\n            replace element, newValue\n\n          value = item()\n\n          # TODO: Work when rendering many sibling elements\n          replace = (oldElement, value) ->\n            element = fn.call(value)\n            element[dataName] = item\n\n            if oldElement\n              parent = oldElement.parentElement\n              parent.insertBefore(element, oldElement)\n              oldElement.remove()\n            else\n              # Assume we got added?\n\n          replace(element, value)\n\n        on: (eventName, fn) ->\n          element = lastParent()\n\n          if eventName is \"change\"\n            switch element.nodeName\n              when \"SELECT\"\n                element[\"on#{eventName}\"] = ->\n                  selectedOption = @options[@selectedIndex]\n                  fn(selectedOption[dataName])\n\n                # Add bi-directionality if binding to an observable\n                if fn.observe\n                  fn.observe (newValue) ->\n                    Array::forEach.call(element.options, (option, index) ->\n                      element.selectedIndex = index if option[dataName] is newValue\n                    )\n              else\n                element[\"on#{eventName}\"] = ->\n                  fn(element.value)\n\n                if fn.observe\n                  fn.observe (newValue) ->\n                    element.value = newValue\n\n          else\n            element[\"on#{eventName}\"] = (event) ->\n              # TODO: Make sure this context is correct for nested\n              # things like `with` and `each`\n              fn.call(context, event)\n\n      return self\n\n    module.exports = Runtime\n",
          "type": "blob"
        },
        "style/demo.styl": {
          "path": "style/demo.styl",
          "mode": "100644",
          "content": "#container \n  .sections \n    textarea\n      width: 50%\n",
          "type": "blob"
        },
        "test/haml-jr.coffee": {
          "path": "test/haml-jr.coffee",
          "mode": "100644",
          "content": "{parser, compile} = HamlJr = require \"/haml-jr\"\n\nrun = (compiled, data) ->\n  Function(\"Runtime\", \"return \" + compiled)(require \"/runtime\")(data)\n\ndescribe 'HamlJr', ->\n  describe 'parser', ->\n    it 'should exist', ->\n      assert(parser)\n\n    it 'should parse some stuff', ->\n      assert parser.parse(\"%yolo\")\n\n  describe 'compiler', ->\n    describe 'keywords', ->\n      it \"should not replace `items.each` with `items.__each`\", ->\n        compiled = compile('- items.each ->')\n\n        assert !compiled.match(/items.__each/)\n\n      it \"should replace `on 'click'` with `__runtime.on 'click'`\", ->\n        compiled = compile('- on \"click\", ->')\n\n        assert compiled.match(/__runtime.on\\(\"click\"/)\n\n  describe \"runtime\", ->\n    it \"should not blow up on undefined text node values\", ->\n      compiled = compile('= @notThere')\n      assert run(compiled)\n\n  describe \"classes\", ->\n    it \"should render the classes passed in along with the classes prefixed\", ->\n      compiled = compile(\".radical(class=@myClass)\")\n\n      result = run compiled,\n        myClass: \"duder\"\n\n      assert.equal result.childNodes[0].className, \"radical duder\"\n\n    # TODO: Observable class attributes\n\n  describe \"ids\", ->\n    it \"should get them from the prefix\", ->\n      compiled = compile(\"#radical\")\n      result = run compiled\n\n      assert.equal result.childNodes[0].id, \"radical\"\n\n    it \"should be overridden by the attribute value if present\", ->\n      compiled = compile(\"#radical(id=@id)\")\n      result = run compiled,\n        id: \"wat\"\n\n      assert.equal result.childNodes[0].id, \"wat\"\n\n    it \"should not be overridden by the attribute value if not present\", ->\n      compiled = compile(\"#radical(id=@id)\")\n      result = run compiled\n\n      assert.equal result.childNodes[0].id, \"radical\"\n\n    # TODO: Observable id attributes\n\n  describe \"text\", ->\n    it \"should render text in nodes\", ->\n      compiled = compile(\"%div heyy\")\n      result = run compiled\n\n      assert.equal result.childNodes[0].textContent, \"heyy\\n\"\n",
          "type": "blob"
        },
        "test/samples.coffee": {
          "path": "test/samples.coffee",
          "mode": "100644",
          "content": "{parser, compile} = HamlJr = require \"/haml-jr\"\n\nsamples =\n  attributes: \"\"\"\n    .yolo(id=@id class=\"cool cat\" data-test=\"test\" dude=@test)\n    #test.yolo2(class=@duder)\n  \"\"\"\n  browser: \"\"\"\n    %html\n      %head\n        %script(src=\"lib/cornerstone.js\")\n        %script(src=\"lib/coffee-script.js\")\n        %script(src=\"lib/jquery-1.10.2.min.js\")\n        %script(src=\"build/web.js\")\n      %body\n        %textarea\n          :verbatim\n            Choose a ticket class:\n            %select\n              - on \"change\", @chosenTicket\n              - each @tickets, ->\n                %option= @name\n\n            %button Clear\n              - on \"click\", @resetTicket\n\n            - with @chosenTicket, ->\n              %p\n                - if @price\n                  You have chosen\n                  %b= @name\n                  %span\n                    $#{@price}\n                - else\n                  No ticket chosen\n\n  \"\"\"\n  code_following_text: \"\"\"\n    Some Text\n    - a = \"wat\"\n  \"\"\"\n  complex: \"\"\"\n    %select\n      - radicalMessage = \"Yolo\"\n      - @tickets.forEach (ticket, i) ->\n        - if i is 0\n          = radicalMessage\n        %option\n          = ticket.name\n  \"\"\"\n  complex2: \"\"\"\n    !!!\n    %html\n      %head\n        %title Ravel | #{@name}'s photo tagged #{@tag}\n\n        - @props.each (key, value) ->\n          %meta(property=key content=value)\n\n        %link{:href => \"/images/favicon.ico\", :rel => \"icon\", :type => \"image/x-icon\"}\n\n        %link(rel=\"stylesheet\" href=\"/stylesheets/normalize.css\")\n        %link(rel=\"stylesheet\" href=\"/stylesheets/bootstrap.min.css\")\n        %link(rel=\"stylesheet\" href=\"/stylesheets/main.css\")\n\n        %script{:src => \"//use.typekit.net/ghp4eka.js\"}\n        :javascript\n          try{Typekit.load();}catch(e){}\n\n      %body\n        .facebook\n          %header\n            %h1.hide-text\n              Ravel\n          .content\n            .container\n              .individual\n                .user-container.clearfix\n                  .left\n                    .user-image\n                      %img{:src => @profile_picture_url}\n                    .user-info\n                      %span.name= @name\n                      %span.info= @gender_and_age\n                      %span.location.info= @location\n                      %span.tag= @tag\n                  .right\n                    %span.pins\n                      %img{:src => \"/images/pins@2x.png\"}\n                      = @pins\n                    %span.likes\n                      %img{:src => \"/images/likes@2x.png\"}\n                      = @likes\n                .photo-container\n                  %img{:src => @photo_url}\n              .download-button\n                %a.button.appstore{:href => \"http://itunes.apple.com/us/app/ravel!/id610859881?ls=1&mt=8\"}\n  \"\"\"\n  empty_lines: \"\"\"\n    %li\n\n      %ul\n\n        Yo\n\n\n\n\n\n  \"\"\"\n  filters: \"\"\"\n    :plain\n      cool\n      super cool\n        double super cool\n  \"\"\"\n  filters2: \"\"\"\n\n\n    :javascript\n      alert('yolo');\n\n    :coffeescript\n      alert \"yolo\"\n\n    .duder\n      col\n\n      :plain\n        sweets\n\n    .duder2\n      cool\n\n  \"\"\"\n  literal: \"\"\"\n    <literal>\n      <wat>\n      </wat>\n    </literal>\n    <yolo></yolo>\n  \"\"\"\n  simple: \"\"\"\n    %section#main.container\n      - post = title: \"cool\", subtitle: \"yolo\", content: \"radical\"\n      %h1= post.title\n      %h2= post.subtitle\n      .content\n        = post.content\n  \"\"\"\n  single_quotes: \"\"\"\n    %img(src='http://duderman.info/\\#{yolocountyusa}' data-rad='what the duder?')\n  \"\"\"\n  tickets: \"\"\"\n    Choose a ticket class:\n    %select\n      - on \"change\", @chosenTicket\n      - each @tickets, ->\n        %option= @name\n\n    %button Clear\n      - on \"click\", @resetTicket\n\n    - with @chosenTicket, ->\n      %p\n        - if @price\n          You have chosen\n          %b= @name\n          %span\n            $#{@price}\n        - else\n          No ticket chosen\n  \"\"\"\n\ndescribe \"Samples\", ->\n  Object.keys(samples).forEach (name) ->\n    data = samples[name]\n\n    it \"should parse '#{name}'\", ->\n      result = parser.parse(data)\n      console.log result\n      assert result\n\n    it \"should compile #{name}\", ->\n      result = compile(data)\n      console.log result\n      assert result\n",
          "type": "blob"
        }
      },
      "distribution": {
        "compiler": {
          "path": "compiler",
          "content": "(function() {\n  var indentText, keywords, keywordsRegex, util,\n    __slice = [].slice;\n\n  indentText = function(text, indent) {\n    if (indent == null) {\n      indent = \"  \";\n    }\n    return indent + text.replace(/\\n/g, \"\\n\" + indent);\n  };\n\n  keywords = [\"on\", \"each\", \"with\"];\n\n  keywordsRegex = RegExp(\"^\\\\s*(\" + (keywords.join('|')) + \")\\\\s+\");\n\n  util = {\n    indent: indentText,\n    filters: {\n      verbatim: function(content, compiler) {\n        return compiler.buffer('\"\"\"' + content.replace(/(#)/, \"\\\\$1\") + '\"\"\"');\n      },\n      plain: function(content, compiler) {\n        return compiler.buffer(JSON.stringify(content));\n      },\n      coffeescript: function(content, compiler) {\n        return [content];\n      },\n      javascript: function(content, compiler) {\n        return [\"`\", compiler.indent(content), \"`\"];\n      }\n    },\n    element: function(tag, contents) {\n      var lines;\n      if (contents == null) {\n        contents = [];\n      }\n      return lines = [\"__runtime.push document.createElement(\" + (JSON.stringify(tag)) + \")\"].concat(__slice.call(contents), [\"__runtime.pop()\"]);\n    },\n    buffer: function(value) {\n      return [\"__runtime.text \" + value];\n    },\n    attributes: function(node) {\n      var attributeLines, attributes, classes, id, ids, idsAndClasses;\n      id = node.id, classes = node.classes, attributes = node.attributes;\n      if (id) {\n        ids = [JSON.stringify(id)];\n      } else {\n        ids = [];\n      }\n      classes = (classes || []).map(JSON.stringify);\n      if (attributes) {\n        attributes = attributes.filter(function(_arg) {\n          var name, value;\n          name = _arg.name, value = _arg.value;\n          if (name === \"class\") {\n            classes.push(value);\n            return false;\n          } else if (name === \"id\") {\n            ids.push(value);\n            return false;\n          } else {\n            return true;\n          }\n        });\n      } else {\n        attributes = [];\n      }\n      idsAndClasses = [];\n      if (ids.length) {\n        idsAndClasses.push(\"__runtime.id \" + (ids.join(', ')));\n      }\n      if (classes.length) {\n        idsAndClasses.push(\"__runtime.classes \" + (classes.join(', ')));\n      }\n      attributeLines = attributes.map(function(_arg) {\n        var name, value;\n        name = _arg.name, value = _arg.value;\n        name = JSON.stringify(name);\n        return \"__runtime.attribute \" + name + \", \" + value;\n      });\n      return idsAndClasses.concat(attributeLines);\n    },\n    render: function(node) {\n      var filter, tag, text;\n      tag = node.tag, filter = node.filter, text = node.text;\n      if (tag) {\n        return this.tag(node);\n      } else if (filter) {\n        return this.filter(node);\n      } else {\n        return this.contents(node);\n      }\n    },\n    replaceKeywords: function(codeString) {\n      return codeString.replace(keywordsRegex, \"__runtime.$1 \");\n    },\n    filter: function(node) {\n      var filter, filterName;\n      filterName = node.filter;\n      if (filter = this.filters[filterName]) {\n        return [].concat.apply([], this.filters[filterName](node.content, this));\n      } else {\n        return [\"__runtime.filter(\" + (JSON.stringify(filterName)) + \", \" + (JSON.stringify(node.content)) + \")\"];\n      }\n    },\n    contents: function(node) {\n      var bufferedCode, childContent, children, code, contents, indent, text, unbufferedCode;\n      children = node.children, bufferedCode = node.bufferedCode, unbufferedCode = node.unbufferedCode, text = node.text;\n      if (unbufferedCode) {\n        indent = true;\n        code = this.replaceKeywords(unbufferedCode);\n        contents = [code];\n      } else if (bufferedCode) {\n        contents = this.buffer(bufferedCode);\n      } else if (text) {\n        contents = this.buffer(JSON.stringify(text));\n      } else if (node.tag) {\n        contents = [];\n      } else if (node.comment) {\n        return [];\n      } else {\n        contents = [];\n        console.warn(\"No content for node:\", node);\n      }\n      if (children) {\n        childContent = this.renderNodes(children);\n        if (indent) {\n          childContent = this.indent(childContent.join(\"\\n\"));\n        }\n        contents = contents.concat(childContent);\n      }\n      return this.attributes(node).concat(contents);\n    },\n    renderNodes: function(nodes) {\n      return [].concat.apply([], nodes.map(this.render, this));\n    },\n    tag: function(node) {\n      var tag;\n      tag = node.tag;\n      return this.element(tag, this.contents(node));\n    }\n  };\n\n  exports.compile = function(parseTree, _arg) {\n    var compiler, items, options, program, programSource, source;\n    compiler = (_arg != null ? _arg : {}).compiler;\n    if (compiler == null) {\n      compiler = CoffeeScript;\n    }\n    items = util.renderNodes(parseTree);\n    source = \"(data) ->\\n  (->\\n    __runtime = Runtime(this)\\n\\n    __runtime.push document.createDocumentFragment()\\n\" + (util.indent(items.join(\"\\n\"), \"    \")) + \"\\n    __runtime.pop()\\n  ).call(data)\";\n    options = {\n      bare: true\n    };\n    programSource = source;\n    program = compiler.compile(programSource, options);\n    return program;\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "demo": {
          "path": "demo",
          "content": "(function() {\n\n\n}).call(this);\n",
          "type": "blob"
        },
        "haml-jr": {
          "path": "haml-jr",
          "content": "(function() {\n  var compile, extend, lexer, oldParse, parser,\n    __slice = [].slice;\n\n  compile = require(\"./compiler\").compile;\n\n  lexer = require(\"./lib/lexer\").lexer;\n\n  parser = require(\"./lib/parser\").parser;\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  oldParse = parser.parse;\n\n  extend(parser, {\n    lexer: lexer,\n    parse: function(input) {\n      extend(parser.yy, {\n        indent: 0,\n        nodePath: [\n          {\n            children: []\n          }\n        ],\n        filterIndent: void 0\n      });\n      return oldParse.call(parser, input);\n    }\n  });\n\n  extend(parser.yy, {\n    extend: extend,\n    newline: function() {\n      var lastNode;\n      lastNode = this.nodePath[this.nodePath.length - 1];\n      if (lastNode.filter) {\n        return this.appendFilterContent(lastNode, \"\");\n      }\n    },\n    append: function(node, indentation) {\n      var index, lastNode, parent;\n      if (indentation == null) {\n        indentation = 0;\n      }\n      if (node.filterLine) {\n        lastNode = this.nodePath[this.nodePath.length - 1];\n        this.appendFilterContent(lastNode, node.filterLine);\n        return;\n      }\n      parent = this.nodePath[indentation];\n      this.appendChild(parent, node);\n      index = indentation + 1;\n      this.nodePath[index] = node;\n      this.nodePath.length = index + 1;\n      return node;\n    },\n    appendChild: function(parent, child) {\n      if (!child.filter) {\n        this.filterIndent = void 0;\n        this.lexer.popState();\n      }\n      parent.children || (parent.children = []);\n      return parent.children.push(child);\n    },\n    appendFilterContent: function(filter, content) {\n      filter.content || (filter.content = \"\");\n      return filter.content += \"\" + content + \"\\n\";\n    }\n  });\n\n  extend(exports, {\n    compile: function(input, options) {\n      if (typeof input === \"string\") {\n        input = parser.parse(input + \"\\n\");\n      }\n      return compile(input, options);\n    },\n    parser: parser\n  });\n\n}).call(this);\n",
          "type": "blob"
        },
        "interactive": {
          "path": "interactive",
          "content": "(function() {\n  var HamlJr;\n\n  HamlJr = require(\"./haml-jr\");\n\n  global.Observable = require(\"observable\");\n\n  global.Runtime = require(\"./runtime\");\n\n  Interactive.register(\"demo\", function(_arg) {\n    var code, model, runtimeElement, source, template, view, _ref;\n    source = _arg.source, runtimeElement = _arg.runtimeElement;\n    code = \"var template, model;\" + CoffeeScript.compile(source, {\n      bare: true\n    });\n    code += \"\\nreturn [template, model];\";\n    _ref = Function(\"Observable\", code)(Observable), template = _ref[0], model = _ref[1];\n    view = Function(\"return \" + HamlJr.compile(template))();\n    return runtimeElement.empty().append(view(model));\n  });\n\n}).call(this);\n",
          "type": "blob"
        },
        "lib/lexer": {
          "path": "lib/lexer",
          "content": "var lexer=function(){var lexer={EOF:1,parseError:function parseError(str,hash){if(this.yy.parser){this.yy.parser.parseError(str,hash)}else{throw new Error(str)}},setInput:function(input){this._input=input;this._more=this._backtrack=this.done=false;this.yylineno=this.yyleng=0;this.yytext=this.matched=this.match=\"\";this.conditionStack=[\"INITIAL\"];this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0};if(this.options.ranges){this.yylloc.range=[0,0]}this.offset=0;return this},input:function(){var ch=this._input[0];this.yytext+=ch;this.yyleng++;this.offset++;this.match+=ch;this.matched+=ch;var lines=ch.match(/(?:\\r\\n?|\\n).*/g);if(lines){this.yylineno++;this.yylloc.last_line++}else{this.yylloc.last_column++}if(this.options.ranges){this.yylloc.range[1]++}this._input=this._input.slice(1);return ch},unput:function(ch){var len=ch.length;var lines=ch.split(/(?:\\r\\n?|\\n)/g);this._input=ch+this._input;this.yytext=this.yytext.substr(0,this.yytext.length-len-1);this.offset-=len;var oldLines=this.match.split(/(?:\\r\\n?|\\n)/g);this.match=this.match.substr(0,this.match.length-1);this.matched=this.matched.substr(0,this.matched.length-1);if(lines.length-1){this.yylineno-=lines.length-1}var r=this.yylloc.range;this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:lines?(lines.length===oldLines.length?this.yylloc.first_column:0)+oldLines[oldLines.length-lines.length].length-lines[0].length:this.yylloc.first_column-len};if(this.options.ranges){this.yylloc.range=[r[0],r[0]+this.yyleng-len]}this.yyleng=this.yytext.length;return this},more:function(){this._more=true;return this},reject:function(){if(this.options.backtrack_lexer){this._backtrack=true}else{return this.parseError(\"Lexical error on line \"+(this.yylineno+1)+\". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\\n\"+this.showPosition(),{text:\"\",token:null,line:this.yylineno})}return this},less:function(n){this.unput(this.match.slice(n))},pastInput:function(){var past=this.matched.substr(0,this.matched.length-this.match.length);return(past.length>20?\"...\":\"\")+past.substr(-20).replace(/\\n/g,\"\")},upcomingInput:function(){var next=this.match;if(next.length<20){next+=this._input.substr(0,20-next.length)}return(next.substr(0,20)+(next.length>20?\"...\":\"\")).replace(/\\n/g,\"\")},showPosition:function(){var pre=this.pastInput();var c=new Array(pre.length+1).join(\"-\");return pre+this.upcomingInput()+\"\\n\"+c+\"^\"},test_match:function(match,indexed_rule){var token,lines,backup;if(this.options.backtrack_lexer){backup={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done};if(this.options.ranges){backup.yylloc.range=this.yylloc.range.slice(0)}}lines=match[0].match(/(?:\\r\\n?|\\n).*/g);if(lines){this.yylineno+=lines.length}this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:lines?lines[lines.length-1].length-lines[lines.length-1].match(/\\r?\\n?/)[0].length:this.yylloc.last_column+match[0].length};this.yytext+=match[0];this.match+=match[0];this.matches=match;this.yyleng=this.yytext.length;if(this.options.ranges){this.yylloc.range=[this.offset,this.offset+=this.yyleng]}this._more=false;this._backtrack=false;this._input=this._input.slice(match[0].length);this.matched+=match[0];token=this.performAction.call(this,this.yy,this,indexed_rule,this.conditionStack[this.conditionStack.length-1]);if(this.done&&this._input){this.done=false}if(token){return token}else if(this._backtrack){for(var k in backup){this[k]=backup[k]}return false}return false},next:function(){if(this.done){return this.EOF}if(!this._input){this.done=true}var token,match,tempMatch,index;if(!this._more){this.yytext=\"\";this.match=\"\"}var rules=this._currentRules();for(var i=0;i<rules.length;i++){tempMatch=this._input.match(this.rules[rules[i]]);if(tempMatch&&(!match||tempMatch[0].length>match[0].length)){match=tempMatch;index=i;if(this.options.backtrack_lexer){token=this.test_match(tempMatch,rules[i]);if(token!==false){return token}else if(this._backtrack){match=false;continue}else{return false}}else if(!this.options.flex){break}}}if(match){token=this.test_match(match,rules[index]);if(token!==false){return token}return false}if(this._input===\"\"){return this.EOF}else{return this.parseError(\"Lexical error on line \"+(this.yylineno+1)+\". Unrecognized text.\\n\"+this.showPosition(),{text:\"\",token:null,line:this.yylineno})}},lex:function lex(){var r=this.next();if(r){return r}else{return this.lex()}},begin:function begin(condition){this.conditionStack.push(condition)},popState:function popState(){var n=this.conditionStack.length-1;if(n>0){return this.conditionStack.pop()}else{return this.conditionStack[0]}},_currentRules:function _currentRules(){if(this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules}else{return this.conditions[\"INITIAL\"].rules}},topState:function topState(n){n=this.conditionStack.length-1-Math.abs(n||0);if(n>=0){return this.conditionStack[n]}else{return\"INITIAL\"}},pushState:function pushState(condition){this.begin(condition)},stateStackSize:function stateStackSize(){return this.conditionStack.length},options:{moduleName:\"lexer\"},performAction:function anonymous(yy,yy_,$avoiding_name_collisions,YY_START){var YYSTATE=YY_START;switch($avoiding_name_collisions){case 0:this.popState();return\"RIGHT_BRACE\";break;case 1:yy_.yytext=yy_.yytext.substring(1);return\"ATTRIBUTE\";break;case 2:this.begin(\"brace_value\");return\"EQUAL\";break;case 3:return\"SEPARATOR\";break;case 4:return\"TEXT\";break;case 5:this.popState();return\"ATTRIBUTE_VALUE\";break;case 6:this.popState();return\"ATTRIBUTE_VALUE\";break;case 7:return\"SEPARATOR\";break;case 8:this.popState();return\"RIGHT_PARENTHESIS\";break;case 9:return\"ATTRIBUTE\";break;case 10:this.begin(\"value\");return\"EQUAL\";break;case 11:this.popState();return\"ATTRIBUTE_VALUE\";break;case 12:this.popState();return\"ATTRIBUTE_VALUE\";break;case 13:this.popState();return\"ATTRIBUTE_VALUE\";break;case 14:yy.indent=0;this.popState();return\"NEWLINE\";break;case 15:return\"FILTER_LINE\";break;case 16:yy.indent=0;return\"NEWLINE\";break;case 17:yy.indent+=1;if(yy.indent>yy.filterIndent){this.begin(\"filter\")};return\"INDENT\";break;case 18:this.begin(\"parentheses_attributes\");return\"LEFT_PARENTHESIS\";break;case 19:this.begin(\"brace_attributes\");return\"LEFT_BRACE\";break;case 20:yy_.yytext=yy_.yytext.substring(1);return\"COMMENT\";break;case 21:yy.filterIndent=yy.indent;yy_.yytext=yy_.yytext.substring(1);return\"FILTER\";break;case 22:yy_.yytext=yy_.yytext.substring(1);return\"ID\";break;case 23:yy_.yytext=yy_.yytext.substring(1);return\"CLASS\";break;case 24:yy_.yytext=yy_.yytext.substring(1);return\"TAG\";break;case 25:yy_.yytext=yy_.yytext.substring(1).trim();return\"BUFFERED_CODE\";break;case 26:yy_.yytext=yy_.yytext.substring(1).trim();return\"UNBUFFERED_CODE\";break;case 27:yy_.yytext=yy_.yytext.trimLeft();return\"TEXT\";break}},rules:[/^(?:\\})/,/^(?::([_a-zA-Z][-_a-zA-Z0-9]*))/,/^(?:[ \\t]*=>[ \\t])/,/^(?:,[ \\t]*)/,/^(?:[^\\}]*)/,/^(?:\"(\\\\.|[^\\\\\"])*\")/,/^(?:[^ \\t\\}]*)/,/^(?:[ \\t]+)/,/^(?:\\))/,/^(?:([_a-zA-Z][-_a-zA-Z0-9]*))/,/^(?:=)/,/^(?:\"(\\\\.|[^\\\\\"])*\")/,/^(?:'(\\\\.|[^\\\\'])*')/,/^(?:[^ \\t\\)]*)/,/^(?:(\\n|$))/,/^(?:[^\\n]*)/,/^(?:\\s*(\\n|$))/,/^(?:  )/,/^(?:\\()/,/^(?:\\{)/,/^(?:\\/.*)/,/^(?::([_a-zA-Z][-_a-zA-Z0-9]*))/,/^(?:#((:|[A-Z]|_|[a-z])((:|[A-Z]|_|[a-z])|-|[0-9])*(?!-)))/,/^(?:\\.((:|[A-Z]|_|[a-z])((:|[A-Z]|_|[a-z])|-|[0-9])*(?!-)))/,/^(?:%((:|[A-Z]|_|[a-z])((:|[A-Z]|_|[a-z])|-|[0-9])*(?!-)))/,/^(?:=.*)/,/^(?:-.*)/,/^(?:.*)/],conditions:{filter:{rules:[14,15],inclusive:false},value:{rules:[11,12,13],inclusive:false},parentheses_attributes:{rules:[7,8,9,10],inclusive:false},brace_value:{rules:[5,6],inclusive:false},brace_attributes:{rules:[0,1,2,3,4],inclusive:false},INITIAL:{rules:[16,17,18,19,20,21,22,23,24,25,26,27],inclusive:true}}};return lexer}();exports.lexer=lexer;",
          "type": "blob"
        },
        "lib/parser": {
          "path": "lib/parser",
          "content": "var parser=function(){var parser={trace:function trace(){},yy:{},symbols_:{error:2,root:3,lines:4,line:5,indentation:6,indentationLevel:7,INDENT:8,lineMain:9,end:10,tag:11,rest:12,COMMENT:13,FILTER:14,FILTER_LINE:15,NEWLINE:16,name:17,tagComponents:18,attributes:19,idComponent:20,classComponents:21,ID:22,CLASS:23,LEFT_PARENTHESIS:24,attributePairs:25,RIGHT_PARENTHESIS:26,LEFT_BRACE:27,RIGHT_BRACE:28,SEPARATOR:29,attributePair:30,ATTRIBUTE:31,EQUAL:32,ATTRIBUTE_VALUE:33,TAG:34,BUFFERED_CODE:35,UNBUFFERED_CODE:36,TEXT:37,$accept:0,$end:1},terminals_:{2:\"error\",8:\"INDENT\",13:\"COMMENT\",14:\"FILTER\",15:\"FILTER_LINE\",16:\"NEWLINE\",22:\"ID\",23:\"CLASS\",24:\"LEFT_PARENTHESIS\",26:\"RIGHT_PARENTHESIS\",27:\"LEFT_BRACE\",28:\"RIGHT_BRACE\",29:\"SEPARATOR\",31:\"ATTRIBUTE\",32:\"EQUAL\",33:\"ATTRIBUTE_VALUE\",34:\"TAG\",35:\"BUFFERED_CODE\",36:\"UNBUFFERED_CODE\",37:\"TEXT\"},productions_:[0,[3,1],[4,2],[4,1],[6,0],[6,1],[7,2],[7,1],[5,3],[5,1],[9,2],[9,1],[9,1],[9,1],[9,1],[9,1],[10,1],[11,2],[11,2],[11,1],[11,1],[18,3],[18,2],[18,2],[18,2],[18,1],[18,1],[20,1],[21,2],[21,1],[19,3],[19,3],[25,3],[25,1],[30,3],[17,1],[12,1],[12,1],[12,1]],performAction:function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$){var $0=$$.length-1;switch(yystate){case 1:return this.$=yy.nodePath[0].children;break;case 2:this.$=$$[$0-1];break;case 3:this.$=$$[$0];break;case 4:this.$=0;break;case 5:this.$=$$[$0];break;case 6:this.$=$$[$0-1]+1;break;case 7:this.$=1;break;case 8:this.$=yy.append($$[$0-1],$$[$0-2]);break;case 9:this.$=function(){if($$[$0].newline){return yy.newline()}}();break;case 10:this.$=yy.extend($$[$0-1],$$[$0]);break;case 11:this.$=$$[$0];break;case 12:this.$=$$[$0];break;case 13:this.$={comment:$$[$0]};break;case 14:this.$={filter:$$[$0]};break;case 15:this.$={filterLine:$$[$0]};break;case 16:this.$={newline:true};break;case 17:this.$=function(){$$[$0].tag=$$[$0-1];return $$[$0]}();break;case 18:this.$={tag:$$[$0-1],attributes:$$[$0]};break;case 19:this.$={tag:$$[$0]};break;case 20:this.$=yy.extend($$[$0],{tag:\"div\"});break;case 21:this.$={id:$$[$0-2],classes:$$[$0-1],attributes:$$[$0]};break;case 22:this.$={id:$$[$0-1],attributes:$$[$0]};break;case 23:this.$={classes:$$[$0-1],attributes:$$[$0]};break;case 24:this.$={id:$$[$0-1],classes:$$[$0]};break;case 25:this.$={id:$$[$0]};break;case 26:this.$={classes:$$[$0]};break;case 27:this.$=$$[$0];break;case 28:this.$=$$[$0-1].concat($$[$0]);break;case 29:this.$=[$$[$0]];break;case 30:this.$=$$[$0-1];break;case 31:this.$=$$[$0-1];break;case 32:this.$=$$[$0-2].concat($$[$0]);break;case 33:this.$=[$$[$0]];break;case 34:this.$={name:$$[$0-2],value:$$[$0]};break;case 35:this.$=$$[$0];break;case 36:this.$={bufferedCode:$$[$0]};break;case 37:this.$={unbufferedCode:$$[$0]};break;case 38:this.$={text:$$[$0]+\"\\n\"};break}},table:[{3:1,4:2,5:3,6:4,7:6,8:[1,8],10:5,13:[2,4],14:[2,4],15:[2,4],16:[1,7],22:[2,4],23:[2,4],34:[2,4],35:[2,4],36:[2,4],37:[2,4]},{1:[3]},{1:[2,1],5:9,6:4,7:6,8:[1,8],10:5,13:[2,4],14:[2,4],15:[2,4],16:[1,7],22:[2,4],23:[2,4],34:[2,4],35:[2,4],36:[2,4],37:[2,4]},{1:[2,3],8:[2,3],13:[2,3],14:[2,3],15:[2,3],16:[2,3],22:[2,3],23:[2,3],34:[2,3],35:[2,3],36:[2,3],37:[2,3]},{9:10,11:11,12:12,13:[1,13],14:[1,14],15:[1,15],17:16,18:17,20:22,21:23,22:[1,24],23:[1,25],34:[1,21],35:[1,18],36:[1,19],37:[1,20]},{1:[2,9],8:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[2,9],22:[2,9],23:[2,9],34:[2,9],35:[2,9],36:[2,9],37:[2,9]},{8:[1,26],13:[2,5],14:[2,5],15:[2,5],22:[2,5],23:[2,5],34:[2,5],35:[2,5],36:[2,5],37:[2,5]},{1:[2,16],8:[2,16],13:[2,16],14:[2,16],15:[2,16],16:[2,16],22:[2,16],23:[2,16],34:[2,16],35:[2,16],36:[2,16],37:[2,16]},{8:[2,7],13:[2,7],14:[2,7],15:[2,7],22:[2,7],23:[2,7],34:[2,7],35:[2,7],36:[2,7],37:[2,7]},{1:[2,2],8:[2,2],13:[2,2],14:[2,2],15:[2,2],16:[2,2],22:[2,2],23:[2,2],34:[2,2],35:[2,2],36:[2,2],37:[2,2]},{10:27,16:[1,7]},{12:28,16:[2,11],35:[1,18],36:[1,19],37:[1,20]},{16:[2,12]},{16:[2,13]},{16:[2,14]},{16:[2,15]},{16:[2,19],18:29,19:30,20:22,21:23,22:[1,24],23:[1,25],24:[1,31],27:[1,32],35:[2,19],36:[2,19],37:[2,19]},{16:[2,20],35:[2,20],36:[2,20],37:[2,20]},{16:[2,36]},{16:[2,37]},{16:[2,38]},{16:[2,35],22:[2,35],23:[2,35],24:[2,35],27:[2,35],35:[2,35],36:[2,35],37:[2,35]},{16:[2,25],19:34,21:33,23:[1,25],24:[1,31],27:[1,32],35:[2,25],36:[2,25],37:[2,25]},{16:[2,26],19:35,23:[1,36],24:[1,31],27:[1,32],35:[2,26],36:[2,26],37:[2,26]},{16:[2,27],23:[2,27],24:[2,27],27:[2,27],35:[2,27],36:[2,27],37:[2,27]},{16:[2,29],23:[2,29],24:[2,29],27:[2,29],35:[2,29],36:[2,29],37:[2,29]},{8:[2,6],13:[2,6],14:[2,6],15:[2,6],22:[2,6],23:[2,6],34:[2,6],35:[2,6],36:[2,6],37:[2,6]},{1:[2,8],8:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[2,8],22:[2,8],23:[2,8],34:[2,8],35:[2,8],36:[2,8],37:[2,8]},{16:[2,10]},{16:[2,17],35:[2,17],36:[2,17],37:[2,17]},{16:[2,18],35:[2,18],36:[2,18],37:[2,18]},{25:37,30:38,31:[1,39]},{25:40,30:38,31:[1,39]},{16:[2,24],19:41,23:[1,36],24:[1,31],27:[1,32],35:[2,24],36:[2,24],37:[2,24]},{16:[2,22],35:[2,22],36:[2,22],37:[2,22]},{16:[2,23],35:[2,23],36:[2,23],37:[2,23]},{16:[2,28],23:[2,28],24:[2,28],27:[2,28],35:[2,28],36:[2,28],37:[2,28]},{26:[1,42],29:[1,43]},{26:[2,33],28:[2,33],29:[2,33]},{32:[1,44]},{28:[1,45],29:[1,43]},{16:[2,21],35:[2,21],36:[2,21],37:[2,21]},{16:[2,30],35:[2,30],36:[2,30],37:[2,30]},{30:46,31:[1,39]},{33:[1,47]},{16:[2,31],35:[2,31],36:[2,31],37:[2,31]},{26:[2,32],28:[2,32],29:[2,32]},{26:[2,34],28:[2,34],29:[2,34]}],defaultActions:{12:[2,12],13:[2,13],14:[2,14],15:[2,15],18:[2,36],19:[2,37],20:[2,38],28:[2,10]},parseError:function parseError(str,hash){if(hash.recoverable){this.trace(str)}else{throw new Error(str)}},parse:function parse(input){var self=this,stack=[0],vstack=[null],lstack=[],table=this.table,yytext=\"\",yylineno=0,yyleng=0,recovering=0,TERROR=2,EOF=1;this.lexer.setInput(input);this.lexer.yy=this.yy;this.yy.lexer=this.lexer;this.yy.parser=this;if(typeof this.lexer.yylloc==\"undefined\"){this.lexer.yylloc={}}var yyloc=this.lexer.yylloc;lstack.push(yyloc);var ranges=this.lexer.options&&this.lexer.options.ranges;if(typeof this.yy.parseError===\"function\"){this.parseError=this.yy.parseError}else{this.parseError=Object.getPrototypeOf(this).parseError}function popStack(n){stack.length=stack.length-2*n;vstack.length=vstack.length-n;lstack.length=lstack.length-n}function lex(){var token;token=self.lexer.lex()||EOF;if(typeof token!==\"number\"){token=self.symbols_[token]||token}return token}var symbol,preErrorSymbol,state,action,a,r,yyval={},p,len,newState,expected;while(true){state=stack[stack.length-1];if(this.defaultActions[state]){action=this.defaultActions[state]}else{if(symbol===null||typeof symbol==\"undefined\"){symbol=lex()}action=table[state]&&table[state][symbol]}if(typeof action===\"undefined\"||!action.length||!action[0]){var errStr=\"\";expected=[];for(p in table[state]){if(this.terminals_[p]&&p>TERROR){expected.push(\"'\"+this.terminals_[p]+\"'\")}}if(this.lexer.showPosition){errStr=\"Parse error on line \"+(yylineno+1)+\":\\n\"+this.lexer.showPosition()+\"\\nExpecting \"+expected.join(\", \")+\", got '\"+(this.terminals_[symbol]||symbol)+\"'\"}else{errStr=\"Parse error on line \"+(yylineno+1)+\": Unexpected \"+(symbol==EOF?\"end of input\":\"'\"+(this.terminals_[symbol]||symbol)+\"'\")}this.parseError(errStr,{text:this.lexer.match,token:this.terminals_[symbol]||symbol,line:this.lexer.yylineno,loc:yyloc,expected:expected})}if(action[0]instanceof Array&&action.length>1){throw new Error(\"Parse Error: multiple actions possible at state: \"+state+\", token: \"+symbol)}switch(action[0]){case 1:stack.push(symbol);vstack.push(this.lexer.yytext);lstack.push(this.lexer.yylloc);stack.push(action[1]);symbol=null;if(!preErrorSymbol){yyleng=this.lexer.yyleng;yytext=this.lexer.yytext;yylineno=this.lexer.yylineno;yyloc=this.lexer.yylloc;if(recovering>0){recovering--}}else{symbol=preErrorSymbol;preErrorSymbol=null}break;case 2:len=this.productions_[action[1]][1];yyval.$=vstack[vstack.length-len];yyval._$={first_line:lstack[lstack.length-(len||1)].first_line,last_line:lstack[lstack.length-1].last_line,first_column:lstack[lstack.length-(len||1)].first_column,last_column:lstack[lstack.length-1].last_column};if(ranges){yyval._$.range=[lstack[lstack.length-(len||1)].range[0],lstack[lstack.length-1].range[1]]}r=this.performAction.call(yyval,yytext,yyleng,yylineno,this.yy,action[1],vstack,lstack);if(typeof r!==\"undefined\"){return r}if(len){stack=stack.slice(0,-1*len*2);vstack=vstack.slice(0,-1*len);lstack=lstack.slice(0,-1*len)}stack.push(this.productions_[action[1]][0]);vstack.push(yyval.$);lstack.push(yyval._$);newState=table[stack[stack.length-2]][stack[stack.length-1]];stack.push(newState);break;case 3:return true}}return true}};undefined;function Parser(){this.yy={}}Parser.prototype=parser;parser.Parser=Parser;return new Parser}();if(typeof require!==\"undefined\"&&typeof exports!==\"undefined\"){exports.parser=parser;exports.Parser=parser.Parser;exports.parse=function(){return parser.parse.apply(parser,arguments)};exports.main=function commonjsMain(args){if(!args[1]){console.log(\"Usage: \"+args[0]+\" FILE\");process.exit(1)}var source=require(\"fs\").readFileSync(require(\"path\").normalize(args[1]),\"utf8\");return exports.parser.parse(source)};if(typeof module!==\"undefined\"&&require.main===module){exports.main(process.argv.slice(1))}}",
          "type": "blob"
        },
        "lib/util": {
          "path": "lib/util",
          "content": "(function() {\n  module.exports = {\n    CSON: {\n      parse: function(source) {\n        return Function(\"return \" + (CoffeeScript.compile(source, {\n          bare: true\n        })))();\n      }\n    },\n    applyStylesheet: function(style, id) {\n      var previousStyleNode, styleNode;\n      if (id == null) {\n        id = \"primary\";\n      }\n      styleNode = document.createElement(\"style\");\n      styleNode.innerHTML = style;\n      styleNode.id = id;\n      if (previousStyleNode = document.head.querySelector(\"style#\" + id)) {\n        previousStyleNode.parentNode.removeChild(prevousStyleNode);\n      }\n      return document.head.appendChild(styleNode);\n    }\n  };\n\n}).call(this);\n",
          "type": "blob"
        },
        "pixie": {
          "path": "pixie",
          "content": "module.exports = {\"version\":\"0.2.1\",\"entryPoint\":\"haml-jr\",\"remoteDependencies\":[\"https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"],\"dependencies\":{\"observable\":\"distri/observable:v0.1.0\"}};",
          "type": "blob"
        },
        "runtime": {
          "path": "runtime",
          "content": "(function() {\n  var Runtime, dataName, document,\n    __slice = [].slice;\n\n  dataName = \"__hamlJR_data\";\n\n  if (typeof window !== \"undefined\" && window !== null) {\n    document = window.document;\n  } else {\n    document = global.document;\n  }\n\n  Runtime = function(context) {\n    var append, bindObservable, classes, id, lastParent, observeAttribute, observeText, pop, push, render, self, stack, top;\n    stack = [];\n    lastParent = function() {\n      var element, i;\n      i = stack.length - 1;\n      while ((element = stack[i]) && element.nodeType === 11) {\n        i -= 1;\n      }\n      return element;\n    };\n    top = function() {\n      return stack[stack.length - 1];\n    };\n    append = function(child) {\n      var _ref;\n      if ((_ref = top()) != null) {\n        _ref.appendChild(child);\n      }\n      return child;\n    };\n    push = function(child) {\n      return stack.push(child);\n    };\n    pop = function() {\n      return append(stack.pop());\n    };\n    render = function(child) {\n      push(child);\n      return pop();\n    };\n    bindObservable = function(element, value, update) {\n      var observable, observe, unobserve;\n      if (typeof Observable === \"undefined\" || Observable === null) {\n        update(value);\n        return;\n      }\n      observable = Observable(value);\n      observe = function() {\n        observable.observe(update);\n        return update(observable());\n      };\n      unobserve = function() {\n        return observable.stopObserving(update);\n      };\n      element.addEventListener(\"DOMNodeInserted\", observe, true);\n      element.addEventListener(\"DOMNodeRemoved\", unobserve, true);\n      return element;\n    };\n    id = function() {\n      var element, sources, update, value;\n      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      element = top();\n      update = function(newValue) {\n        if (typeof newValue === \"function\") {\n          newValue = newValue();\n        }\n        return element.id = newValue;\n      };\n      value = function() {\n        var possibleValues;\n        possibleValues = sources.map(function(source) {\n          if (typeof source === \"function\") {\n            return source();\n          } else {\n            return source;\n          }\n        }).filter(function(idValue) {\n          return idValue != null;\n        });\n        return possibleValues[possibleValues.length - 1];\n      };\n      return bindObservable(element, value, update);\n    };\n    classes = function() {\n      var element, sources, update, value;\n      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      element = top();\n      update = function(newValue) {\n        if (typeof newValue === \"function\") {\n          newValue = newValue();\n        }\n        return element.className = newValue;\n      };\n      value = function() {\n        var possibleValues;\n        possibleValues = sources.map(function(source) {\n          if (typeof source === \"function\") {\n            return source();\n          } else {\n            return source;\n          }\n        }).filter(function(sourceValue) {\n          return sourceValue != null;\n        });\n        return possibleValues.join(\" \");\n      };\n      return bindObservable(element, value, update);\n    };\n    observeAttribute = function(name, value) {\n      var element, update;\n      element = top();\n      if ((name === \"value\") && (typeof value === \"function\")) {\n        element.value = value();\n        element.onchange = function() {\n          return value(element.value);\n        };\n        if (value.observe) {\n          value.observe(function(newValue) {\n            return element.value = newValue;\n          });\n        }\n      } else {\n        update = function(newValue) {\n          return element.setAttribute(name, newValue);\n        };\n        bindObservable(element, value, update);\n      }\n      return element;\n    };\n    observeText = function(value) {\n      var element, update;\n      switch (value != null ? value.nodeType : void 0) {\n        case 1:\n        case 3:\n        case 11:\n          render(value);\n          return;\n      }\n      element = document.createTextNode('');\n      update = function(newValue) {\n        return element.nodeValue = newValue;\n      };\n      bindObservable(element, value, update);\n      return render(element);\n    };\n    self = {\n      push: push,\n      pop: pop,\n      id: id,\n      classes: classes,\n      attribute: observeAttribute,\n      text: observeText,\n      filter: function(name, content) {},\n      each: function(items, fn) {\n        var elements, parent, replace;\n        items = Observable(items);\n        elements = [];\n        parent = lastParent();\n        items.observe(function(newItems) {\n          return replace(elements, newItems);\n        });\n        replace = function(oldElements, items) {\n          var firstElement;\n          if (oldElements) {\n            firstElement = oldElements[0];\n            parent = (firstElement != null ? firstElement.parentElement : void 0) || parent;\n            elements = items.map(function(item, index, array) {\n              var element;\n              element = fn.call(item, item, index, array);\n              element[dataName] = item;\n              parent.insertBefore(element, firstElement);\n              return element;\n            });\n            return oldElements.forEach(function(element) {\n              return element.remove();\n            });\n          } else {\n            return elements = items.map(function(item, index, array) {\n              var element;\n              element = fn.call(item, item, index, array);\n              element[dataName] = item;\n              return element;\n            });\n          }\n        };\n        return replace(null, items);\n      },\n      \"with\": function(item, fn) {\n        var element, replace, value;\n        element = null;\n        item = Observable(item);\n        item.observe(function(newValue) {\n          return replace(element, newValue);\n        });\n        value = item();\n        replace = function(oldElement, value) {\n          var parent;\n          element = fn.call(value);\n          element[dataName] = item;\n          if (oldElement) {\n            parent = oldElement.parentElement;\n            parent.insertBefore(element, oldElement);\n            return oldElement.remove();\n          } else {\n\n          }\n        };\n        return replace(element, value);\n      },\n      on: function(eventName, fn) {\n        var element;\n        element = lastParent();\n        if (eventName === \"change\") {\n          switch (element.nodeName) {\n            case \"SELECT\":\n              element[\"on\" + eventName] = function() {\n                var selectedOption;\n                selectedOption = this.options[this.selectedIndex];\n                return fn(selectedOption[dataName]);\n              };\n              if (fn.observe) {\n                return fn.observe(function(newValue) {\n                  return Array.prototype.forEach.call(element.options, function(option, index) {\n                    if (option[dataName] === newValue) {\n                      return element.selectedIndex = index;\n                    }\n                  });\n                });\n              }\n              break;\n            default:\n              element[\"on\" + eventName] = function() {\n                return fn(element.value);\n              };\n              if (fn.observe) {\n                return fn.observe(function(newValue) {\n                  return element.value = newValue;\n                });\n              }\n          }\n        } else {\n          return element[\"on\" + eventName] = function(event) {\n            return fn.call(context, event);\n          };\n        }\n      }\n    };\n    return self;\n  };\n\n  module.exports = Runtime;\n\n}).call(this);\n",
          "type": "blob"
        },
        "style/demo": {
          "path": "style/demo",
          "content": "module.exports = \"#container  .sections  textarea {\\n  width: 50%;\\n}\";",
          "type": "blob"
        },
        "test/haml-jr": {
          "path": "test/haml-jr",
          "content": "(function() {\n  var HamlJr, compile, parser, run, _ref;\n\n  _ref = HamlJr = require(\"/haml-jr\"), parser = _ref.parser, compile = _ref.compile;\n\n  run = function(compiled, data) {\n    return Function(\"Runtime\", \"return \" + compiled)(require(\"/runtime\"))(data);\n  };\n\n  describe('HamlJr', function() {\n    describe('parser', function() {\n      it('should exist', function() {\n        return assert(parser);\n      });\n      return it('should parse some stuff', function() {\n        return assert(parser.parse(\"%yolo\"));\n      });\n    });\n    describe('compiler', function() {\n      return describe('keywords', function() {\n        it(\"should not replace `items.each` with `items.__each`\", function() {\n          var compiled;\n          compiled = compile('- items.each ->');\n          return assert(!compiled.match(/items.__each/));\n        });\n        return it(\"should replace `on 'click'` with `__runtime.on 'click'`\", function() {\n          var compiled;\n          compiled = compile('- on \"click\", ->');\n          return assert(compiled.match(/__runtime.on\\(\"click\"/));\n        });\n      });\n    });\n    describe(\"runtime\", function() {\n      return it(\"should not blow up on undefined text node values\", function() {\n        var compiled;\n        compiled = compile('= @notThere');\n        return assert(run(compiled));\n      });\n    });\n    describe(\"classes\", function() {\n      return it(\"should render the classes passed in along with the classes prefixed\", function() {\n        var compiled, result;\n        compiled = compile(\".radical(class=@myClass)\");\n        result = run(compiled, {\n          myClass: \"duder\"\n        });\n        return assert.equal(result.childNodes[0].className, \"radical duder\");\n      });\n    });\n    describe(\"ids\", function() {\n      it(\"should get them from the prefix\", function() {\n        var compiled, result;\n        compiled = compile(\"#radical\");\n        result = run(compiled);\n        return assert.equal(result.childNodes[0].id, \"radical\");\n      });\n      it(\"should be overridden by the attribute value if present\", function() {\n        var compiled, result;\n        compiled = compile(\"#radical(id=@id)\");\n        result = run(compiled, {\n          id: \"wat\"\n        });\n        return assert.equal(result.childNodes[0].id, \"wat\");\n      });\n      return it(\"should not be overridden by the attribute value if not present\", function() {\n        var compiled, result;\n        compiled = compile(\"#radical(id=@id)\");\n        result = run(compiled);\n        return assert.equal(result.childNodes[0].id, \"radical\");\n      });\n    });\n    return describe(\"text\", function() {\n      return it(\"should render text in nodes\", function() {\n        var compiled, result;\n        compiled = compile(\"%div heyy\");\n        result = run(compiled);\n        return assert.equal(result.childNodes[0].textContent, \"heyy\\n\");\n      });\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        },
        "test/samples": {
          "path": "test/samples",
          "content": "(function() {\n  var HamlJr, compile, parser, samples, _ref;\n\n  _ref = HamlJr = require(\"/haml-jr\"), parser = _ref.parser, compile = _ref.compile;\n\n  samples = {\n    attributes: \".yolo(id=@id class=\\\"cool cat\\\" data-test=\\\"test\\\" dude=@test)\\n#test.yolo2(class=@duder)\",\n    browser: \"%html\\n  %head\\n    %script(src=\\\"lib/cornerstone.js\\\")\\n    %script(src=\\\"lib/coffee-script.js\\\")\\n    %script(src=\\\"lib/jquery-1.10.2.min.js\\\")\\n    %script(src=\\\"build/web.js\\\")\\n  %body\\n    %textarea\\n      :verbatim\\n        Choose a ticket class:\\n        %select\\n          - on \\\"change\\\", @chosenTicket\\n          - each @tickets, ->\\n            %option= @name\\n\\n        %button Clear\\n          - on \\\"click\\\", @resetTicket\\n\\n        - with @chosenTicket, ->\\n          %p\\n            - if @price\\n              You have chosen\\n              %b= @name\\n              %span\\n                $\" + this.price + \"\\n            - else\\n              No ticket chosen\\n\",\n    code_following_text: \"Some Text\\n- a = \\\"wat\\\"\",\n    complex: \"%select\\n  - radicalMessage = \\\"Yolo\\\"\\n  - @tickets.forEach (ticket, i) ->\\n    - if i is 0\\n      = radicalMessage\\n    %option\\n      = ticket.name\",\n    complex2: \"!!!\\n%html\\n  %head\\n    %title Ravel | \" + this.name + \"'s photo tagged \" + this.tag + \"\\n\\n    - @props.each (key, value) ->\\n      %meta(property=key content=value)\\n\\n    %link{:href => \\\"/images/favicon.ico\\\", :rel => \\\"icon\\\", :type => \\\"image/x-icon\\\"}\\n\\n    %link(rel=\\\"stylesheet\\\" href=\\\"/stylesheets/normalize.css\\\")\\n    %link(rel=\\\"stylesheet\\\" href=\\\"/stylesheets/bootstrap.min.css\\\")\\n    %link(rel=\\\"stylesheet\\\" href=\\\"/stylesheets/main.css\\\")\\n\\n    %script{:src => \\\"//use.typekit.net/ghp4eka.js\\\"}\\n    :javascript\\n      try{Typekit.load();}catch(e){}\\n\\n  %body\\n    .facebook\\n      %header\\n        %h1.hide-text\\n          Ravel\\n      .content\\n        .container\\n          .individual\\n            .user-container.clearfix\\n              .left\\n                .user-image\\n                  %img{:src => @profile_picture_url}\\n                .user-info\\n                  %span.name= @name\\n                  %span.info= @gender_and_age\\n                  %span.location.info= @location\\n                  %span.tag= @tag\\n              .right\\n                %span.pins\\n                  %img{:src => \\\"/images/pins@2x.png\\\"}\\n                  = @pins\\n                %span.likes\\n                  %img{:src => \\\"/images/likes@2x.png\\\"}\\n                  = @likes\\n            .photo-container\\n              %img{:src => @photo_url}\\n          .download-button\\n            %a.button.appstore{:href => \\\"http://itunes.apple.com/us/app/ravel!/id610859881?ls=1&mt=8\\\"}\",\n    empty_lines: \"%li\\n\\n  %ul\\n\\n    Yo\\n\\n\\n\\n\\n\",\n    filters: \":plain\\n  cool\\n  super cool\\n    double super cool\",\n    filters2: \"\\n\\n:javascript\\n  alert('yolo');\\n\\n:coffeescript\\n  alert \\\"yolo\\\"\\n\\n.duder\\n  col\\n\\n  :plain\\n    sweets\\n\\n.duder2\\n  cool\\n\",\n    literal: \"<literal>\\n  <wat>\\n  </wat>\\n</literal>\\n<yolo></yolo>\",\n    simple: \"%section#main.container\\n  - post = title: \\\"cool\\\", subtitle: \\\"yolo\\\", content: \\\"radical\\\"\\n  %h1= post.title\\n  %h2= post.subtitle\\n  .content\\n    = post.content\",\n    single_quotes: \"%img(src='http://duderman.info/\\#{yolocountyusa}' data-rad='what the duder?')\",\n    tickets: \"Choose a ticket class:\\n%select\\n  - on \\\"change\\\", @chosenTicket\\n  - each @tickets, ->\\n    %option= @name\\n\\n%button Clear\\n  - on \\\"click\\\", @resetTicket\\n\\n- with @chosenTicket, ->\\n  %p\\n    - if @price\\n      You have chosen\\n      %b= @name\\n      %span\\n        $\" + this.price + \"\\n    - else\\n      No ticket chosen\"\n  };\n\n  describe(\"Samples\", function() {\n    return Object.keys(samples).forEach(function(name) {\n      var data;\n      data = samples[name];\n      it(\"should parse '\" + name + \"'\", function() {\n        var result;\n        result = parser.parse(data);\n        console.log(result);\n        return assert(result);\n      });\n      return it(\"should compile \" + name, function() {\n        var result;\n        result = compile(data);\n        console.log(result);\n        return assert(result);\n      });\n    });\n  });\n\n}).call(this);\n",
          "type": "blob"
        }
      },
      "progenitor": {
        "url": "http://strd6.github.io/editor/"
      },
      "version": "0.2.1",
      "entryPoint": "haml-jr",
      "remoteDependencies": [
        "https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js"
      ],
      "repository": {
        "id": 17689708,
        "name": "haml-jr",
        "full_name": "distri/haml-jr",
        "owner": {
          "login": "distri",
          "id": 6005125,
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
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
        "html_url": "https://github.com/distri/haml-jr",
        "description": "Haml reborn. Pure HTML5 templating.",
        "fork": false,
        "url": "https://api.github.com/repos/distri/haml-jr",
        "forks_url": "https://api.github.com/repos/distri/haml-jr/forks",
        "keys_url": "https://api.github.com/repos/distri/haml-jr/keys{/key_id}",
        "collaborators_url": "https://api.github.com/repos/distri/haml-jr/collaborators{/collaborator}",
        "teams_url": "https://api.github.com/repos/distri/haml-jr/teams",
        "hooks_url": "https://api.github.com/repos/distri/haml-jr/hooks",
        "issue_events_url": "https://api.github.com/repos/distri/haml-jr/issues/events{/number}",
        "events_url": "https://api.github.com/repos/distri/haml-jr/events",
        "assignees_url": "https://api.github.com/repos/distri/haml-jr/assignees{/user}",
        "branches_url": "https://api.github.com/repos/distri/haml-jr/branches{/branch}",
        "tags_url": "https://api.github.com/repos/distri/haml-jr/tags",
        "blobs_url": "https://api.github.com/repos/distri/haml-jr/git/blobs{/sha}",
        "git_tags_url": "https://api.github.com/repos/distri/haml-jr/git/tags{/sha}",
        "git_refs_url": "https://api.github.com/repos/distri/haml-jr/git/refs{/sha}",
        "trees_url": "https://api.github.com/repos/distri/haml-jr/git/trees{/sha}",
        "statuses_url": "https://api.github.com/repos/distri/haml-jr/statuses/{sha}",
        "languages_url": "https://api.github.com/repos/distri/haml-jr/languages",
        "stargazers_url": "https://api.github.com/repos/distri/haml-jr/stargazers",
        "contributors_url": "https://api.github.com/repos/distri/haml-jr/contributors",
        "subscribers_url": "https://api.github.com/repos/distri/haml-jr/subscribers",
        "subscription_url": "https://api.github.com/repos/distri/haml-jr/subscription",
        "commits_url": "https://api.github.com/repos/distri/haml-jr/commits{/sha}",
        "git_commits_url": "https://api.github.com/repos/distri/haml-jr/git/commits{/sha}",
        "comments_url": "https://api.github.com/repos/distri/haml-jr/comments{/number}",
        "issue_comment_url": "https://api.github.com/repos/distri/haml-jr/issues/comments/{number}",
        "contents_url": "https://api.github.com/repos/distri/haml-jr/contents/{+path}",
        "compare_url": "https://api.github.com/repos/distri/haml-jr/compare/{base}...{head}",
        "merges_url": "https://api.github.com/repos/distri/haml-jr/merges",
        "archive_url": "https://api.github.com/repos/distri/haml-jr/{archive_format}{/ref}",
        "downloads_url": "https://api.github.com/repos/distri/haml-jr/downloads",
        "issues_url": "https://api.github.com/repos/distri/haml-jr/issues{/number}",
        "pulls_url": "https://api.github.com/repos/distri/haml-jr/pulls{/number}",
        "milestones_url": "https://api.github.com/repos/distri/haml-jr/milestones{/number}",
        "notifications_url": "https://api.github.com/repos/distri/haml-jr/notifications{?since,all,participating}",
        "labels_url": "https://api.github.com/repos/distri/haml-jr/labels{/name}",
        "releases_url": "https://api.github.com/repos/distri/haml-jr/releases{/id}",
        "created_at": "2014-03-13T00:54:54Z",
        "updated_at": "2014-04-01T21:01:08Z",
        "pushed_at": "2014-04-01T21:01:08Z",
        "git_url": "git://github.com/distri/haml-jr.git",
        "ssh_url": "git@github.com:distri/haml-jr.git",
        "clone_url": "https://github.com/distri/haml-jr.git",
        "svn_url": "https://github.com/distri/haml-jr",
        "homepage": null,
        "size": 348,
        "stargazers_count": 0,
        "watchers_count": 0,
        "language": "CoffeeScript",
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
          "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
          "gravatar_id": "192f3f168409e79c42107f081139d9f3",
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
        "branch": "v0.2.1",
        "publishBranch": "gh-pages"
      },
      "dependencies": {
        "observable": {
          "source": {
            "LICENSE": {
              "path": "LICENSE",
              "mode": "100644",
              "content": "The MIT License (MIT)\n\nCopyright (c) 2014 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
              "type": "blob"
            },
            "README.md": {
              "path": "README.md",
              "mode": "100644",
              "content": "observable\n==========\n",
              "type": "blob"
            },
            "main.coffee.md": {
              "path": "main.coffee.md",
              "mode": "100644",
              "content": "Observable\n==========\n\n`Observable` allows for observing arrays, functions, and objects.\n\nFunction dependencies are automagically observed.\n\nStandard array methods are proxied through to the underlying array.\n\n    Observable = (value) ->\n\nReturn the object if it is already an observable object.\n\n      return value if typeof value?.observe is \"function\"\n\nMaintain a set of listeners to observe changes and provide a helper to notify each observer.\n\n      listeners = []\n\n      notify = (newValue) ->\n        listeners.forEach (listener) ->\n          listener(newValue)\n\nOur observable function is stored as a reference to `self`.\n\nIf `value` is a function compute dependencies and listen to observables that it depends on.\n\n      if typeof value is 'function'\n        fn = value\n        self = ->\n          # Automagic dependency observation\n          if base\n            self.observe base\n\n          return value\n\n        self.observe = (listener) ->\n          listeners.push listener\n\n        changed = ->\n          value = fn()\n          notify(value)\n\n        value = computeDependencies(fn, changed)\n\n      else\n\nWhen called with zero arguments it is treated as a getter. When called with one argument it is treated as a setter.\n\nChanges to the value will trigger notifications.\n\nThe value is always returned.\n\n        self = (newValue) ->\n          if arguments.length > 0\n            if value != newValue\n              value = newValue\n\n              notify(newValue)\n          else\n            # Automagic dependency observation\n            if base\n              self.observe base\n\n          return value\n\nAdd a listener for when this object changes.\n\n        self.observe = (listener) ->\n          listeners.push listener\n\nThis `each` iterator is similar to [the Maybe monad](http://en.wikipedia.org/wiki/Monad_&#40;functional_programming&#41;#The_Maybe_monad) in that our observable may contain a single value or nothing at all.\n\n      self.each = (args...) ->\n        if value?\n          [value].forEach(args...)\n\nIf the value is an array then proxy array methods and add notifications to mutation events.\n\n      if Array.isArray(value)\n        [\n          \"concat\"\n          \"every\"\n          \"filter\"\n          \"forEach\"\n          \"indexOf\"\n          \"join\"\n          \"lastIndexOf\"\n          \"map\"\n          \"reduce\"\n          \"reduceRight\"\n          \"slice\"\n          \"some\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            value[method](args...)\n\n        [\n          \"pop\"\n          \"push\"\n          \"reverse\"\n          \"shift\"\n          \"splice\"\n          \"sort\"\n          \"unshift\"\n        ].forEach (method) ->\n          self[method] = (args...) ->\n            notifyReturning value[method](args...)\n\n        notifyReturning = (returnValue) ->\n          notify(value)\n\n          return returnValue\n\nAdd some extra helpful methods to array observables.\n\n        extend self,\n          each: (args...) ->\n            self.forEach(args...)\n\n            return self\n\nRemove an element from the array and notify observers of changes.\n\n          remove: (object) ->\n            index = value.indexOf(object)\n\n            if index >= 0\n              notifyReturning value.splice(index, 1)[0]\n\n          get: (index) ->\n            value[index]\n\n          first: ->\n            value[0]\n\n          last: ->\n            value[value.length-1]\n\n      self.stopObserving = (fn) ->\n        remove listeners, fn\n\n      return self\n\nExport `Observable`\n\n    module.exports = Observable\n\nAppendix\n--------\n\nThe extend method adds one objects properties to another.\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\n    base = undefined\n\nAutomagically compute dependencies.\n\n    computeDependencies = (fn, root) ->\n      base = root\n      value = fn()\n      base = undefined\n\n      return value\n\nRemove a value from an array.\n\n    remove = (array, value) ->\n      index = array.indexOf(value)\n\n      if index >= 0\n        array.splice(index, 1)[0]\n",
              "type": "blob"
            },
            "test/observable.coffee": {
              "path": "test/observable.coffee",
              "mode": "100644",
              "content": "Observable = require \"../main\"\n\ndescribe 'Observable', ->\n  it 'should create an observable for an object', ->\n    n = 5\n\n    observable = Observable(n)\n\n    assert.equal(observable(), n)\n\n  it 'should fire events when setting', ->\n    string = \"yolo\"\n\n    observable = Observable(string)\n    observable.observe (newValue) ->\n      assert.equal newValue, \"4life\"\n\n    observable(\"4life\")\n\n  it 'should be idempotent', ->\n    o = Observable(5)\n\n    assert.equal o, Observable(o)\n\n  describe \"#each\", ->\n    it \"should be invoked once if there is an observable\", ->\n      o = Observable(5)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n        assert.equal value, 5\n\n      assert.equal called, 1\n\n    it \"should not be invoked if observable is null\", ->\n      o = Observable(null)\n      called = 0\n\n      o.each (value) ->\n        called += 1\n\n      assert.equal called, 0\n\n  it \"should allow for stopping observation\", ->\n    observable = Observable(\"string\")\n\n    called = 0\n    fn = (newValue) ->\n      called += 1\n      assert.equal newValue, \"4life\"\n\n    observable.observe fn\n\n    observable(\"4life\")\n\n    observable.stopObserving fn\n\n    observable(\"wat\")\n\n    assert.equal called, 1\n\ndescribe \"Observable Array\", ->\n  it \"should proxy array methods\", ->\n    o = Observable [5]\n\n    o.map (n) ->\n      assert.equal n, 5\n\n  it \"should notify on mutation methods\", (done) ->\n    o = Observable []\n\n    o.observe (newValue) ->\n      assert.equal newValue[0], 1\n\n    o.push 1\n\n    done()\n\n  it \"should have an each method\", ->\n    o = Observable []\n\n    assert o.each\n\n  it \"#get\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.get(2), 2\n\n  it \"#first\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.first(), 0\n\n  it \"#last\", ->\n    o = Observable [0, 1, 2, 3]\n\n    assert.equal o.last(), 3\n\n  it \"#remove\", (done) ->\n    o = Observable [0, 1, 2, 3]\n\n    o.observe (newValue) ->\n      assert.equal newValue.length, 3\n      setTimeout ->\n        done()\n      , 0\n\n    assert.equal o.remove(2), 2\n\n  # TODO: This looks like it might be impossible\n  it \"should proxy the length property\"\n\ndescribe \"Observable functions\", ->\n  it \"should compute dependencies\", (done) ->\n    firstName = Observable \"Duder\"\n    lastName = Observable \"Man\"\n\n    o = Observable ->\n      \"#{firstName()} #{lastName()}\"\n\n    o.observe (newValue) ->\n      assert.equal newValue, \"Duder Bro\"\n\n      done()\n\n    lastName \"Bro\"\n\n  it \"should allow double nesting\", (done) ->\n    bottom = Observable \"rad\"\n    middle = Observable ->\n      bottom()\n    top = Observable ->\n      middle()\n\n    top.observe (newValue) ->\n      assert.equal newValue, \"wat\"\n      assert.equal top(), newValue\n      assert.equal middle(), newValue\n\n      done()\n\n    bottom(\"wat\")\n\n  it \"should have an each method\", ->\n    o = Observable ->\n\n    assert o.each\n\n  it \"should not invoke when returning undefined\", ->\n    o = Observable ->\n\n    o.each ->\n      assert false\n\n  it \"should invoke when returning any defined value\", (done) ->\n    o = Observable -> 5\n\n    o.each (n) ->\n      assert.equal n, 5\n      done()\n",
              "type": "blob"
            },
            "pixie.cson": {
              "path": "pixie.cson",
              "mode": "100644",
              "content": "version: \"0.1.0\"\n",
              "type": "blob"
            }
          },
          "distribution": {
            "main": {
              "path": "main",
              "content": "(function() {\n  var Observable, base, computeDependencies, extend, remove,\n    __slice = [].slice;\n\n  Observable = function(value) {\n    var changed, fn, listeners, notify, notifyReturning, self;\n    if (typeof (value != null ? value.observe : void 0) === \"function\") {\n      return value;\n    }\n    listeners = [];\n    notify = function(newValue) {\n      return listeners.forEach(function(listener) {\n        return listener(newValue);\n      });\n    };\n    if (typeof value === 'function') {\n      fn = value;\n      self = function() {\n        if (base) {\n          self.observe(base);\n        }\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n      changed = function() {\n        value = fn();\n        return notify(value);\n      };\n      value = computeDependencies(fn, changed);\n    } else {\n      self = function(newValue) {\n        if (arguments.length > 0) {\n          if (value !== newValue) {\n            value = newValue;\n            notify(newValue);\n          }\n        } else {\n          if (base) {\n            self.observe(base);\n          }\n        }\n        return value;\n      };\n      self.observe = function(listener) {\n        return listeners.push(listener);\n      };\n    }\n    self.each = function() {\n      var args, _ref;\n      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      if (value != null) {\n        return (_ref = [value]).forEach.apply(_ref, args);\n      }\n    };\n    if (Array.isArray(value)) {\n      [\"concat\", \"every\", \"filter\", \"forEach\", \"indexOf\", \"join\", \"lastIndexOf\", \"map\", \"reduce\", \"reduceRight\", \"slice\", \"some\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return value[method].apply(value, args);\n        };\n      });\n      [\"pop\", \"push\", \"reverse\", \"shift\", \"splice\", \"sort\", \"unshift\"].forEach(function(method) {\n        return self[method] = function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return notifyReturning(value[method].apply(value, args));\n        };\n      });\n      notifyReturning = function(returnValue) {\n        notify(value);\n        return returnValue;\n      };\n      extend(self, {\n        each: function() {\n          var args;\n          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          self.forEach.apply(self, args);\n          return self;\n        },\n        remove: function(object) {\n          var index;\n          index = value.indexOf(object);\n          if (index >= 0) {\n            return notifyReturning(value.splice(index, 1)[0]);\n          }\n        },\n        get: function(index) {\n          return value[index];\n        },\n        first: function() {\n          return value[0];\n        },\n        last: function() {\n          return value[value.length - 1];\n        }\n      });\n    }\n    self.stopObserving = function(fn) {\n      return remove(listeners, fn);\n    };\n    return self;\n  };\n\n  module.exports = Observable;\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  base = void 0;\n\n  computeDependencies = function(fn, root) {\n    var value;\n    base = root;\n    value = fn();\n    base = void 0;\n    return value;\n  };\n\n  remove = function(array, value) {\n    var index;\n    index = array.indexOf(value);\n    if (index >= 0) {\n      return array.splice(index, 1)[0];\n    }\n  };\n\n}).call(this);\n\n//# sourceURL=main.coffee",
              "type": "blob"
            },
            "test/observable": {
              "path": "test/observable",
              "content": "(function() {\n  var Observable;\n\n  Observable = require(\"../main\");\n\n  describe('Observable', function() {\n    it('should create an observable for an object', function() {\n      var n, observable;\n      n = 5;\n      observable = Observable(n);\n      return assert.equal(observable(), n);\n    });\n    it('should fire events when setting', function() {\n      var observable, string;\n      string = \"yolo\";\n      observable = Observable(string);\n      observable.observe(function(newValue) {\n        return assert.equal(newValue, \"4life\");\n      });\n      return observable(\"4life\");\n    });\n    it('should be idempotent', function() {\n      var o;\n      o = Observable(5);\n      return assert.equal(o, Observable(o));\n    });\n    describe(\"#each\", function() {\n      it(\"should be invoked once if there is an observable\", function() {\n        var called, o;\n        o = Observable(5);\n        called = 0;\n        o.each(function(value) {\n          called += 1;\n          return assert.equal(value, 5);\n        });\n        return assert.equal(called, 1);\n      });\n      return it(\"should not be invoked if observable is null\", function() {\n        var called, o;\n        o = Observable(null);\n        called = 0;\n        o.each(function(value) {\n          return called += 1;\n        });\n        return assert.equal(called, 0);\n      });\n    });\n    return it(\"should allow for stopping observation\", function() {\n      var called, fn, observable;\n      observable = Observable(\"string\");\n      called = 0;\n      fn = function(newValue) {\n        called += 1;\n        return assert.equal(newValue, \"4life\");\n      };\n      observable.observe(fn);\n      observable(\"4life\");\n      observable.stopObserving(fn);\n      observable(\"wat\");\n      return assert.equal(called, 1);\n    });\n  });\n\n  describe(\"Observable Array\", function() {\n    it(\"should proxy array methods\", function() {\n      var o;\n      o = Observable([5]);\n      return o.map(function(n) {\n        return assert.equal(n, 5);\n      });\n    });\n    it(\"should notify on mutation methods\", function(done) {\n      var o;\n      o = Observable([]);\n      o.observe(function(newValue) {\n        return assert.equal(newValue[0], 1);\n      });\n      o.push(1);\n      return done();\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable([]);\n      return assert(o.each);\n    });\n    it(\"#get\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.get(2), 2);\n    });\n    it(\"#first\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.first(), 0);\n    });\n    it(\"#last\", function() {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      return assert.equal(o.last(), 3);\n    });\n    it(\"#remove\", function(done) {\n      var o;\n      o = Observable([0, 1, 2, 3]);\n      o.observe(function(newValue) {\n        assert.equal(newValue.length, 3);\n        return setTimeout(function() {\n          return done();\n        }, 0);\n      });\n      return assert.equal(o.remove(2), 2);\n    });\n    return it(\"should proxy the length property\");\n  });\n\n  describe(\"Observable functions\", function() {\n    it(\"should compute dependencies\", function(done) {\n      var firstName, lastName, o;\n      firstName = Observable(\"Duder\");\n      lastName = Observable(\"Man\");\n      o = Observable(function() {\n        return \"\" + (firstName()) + \" \" + (lastName());\n      });\n      o.observe(function(newValue) {\n        assert.equal(newValue, \"Duder Bro\");\n        return done();\n      });\n      return lastName(\"Bro\");\n    });\n    it(\"should allow double nesting\", function(done) {\n      var bottom, middle, top;\n      bottom = Observable(\"rad\");\n      middle = Observable(function() {\n        return bottom();\n      });\n      top = Observable(function() {\n        return middle();\n      });\n      top.observe(function(newValue) {\n        assert.equal(newValue, \"wat\");\n        assert.equal(top(), newValue);\n        assert.equal(middle(), newValue);\n        return done();\n      });\n      return bottom(\"wat\");\n    });\n    it(\"should have an each method\", function() {\n      var o;\n      o = Observable(function() {});\n      return assert(o.each);\n    });\n    it(\"should not invoke when returning undefined\", function() {\n      var o;\n      o = Observable(function() {});\n      return o.each(function() {\n        return assert(false);\n      });\n    });\n    return it(\"should invoke when returning any defined value\", function(done) {\n      var o;\n      o = Observable(function() {\n        return 5;\n      });\n      return o.each(function(n) {\n        assert.equal(n, 5);\n        return done();\n      });\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/observable.coffee",
              "type": "blob"
            },
            "pixie": {
              "path": "pixie",
              "content": "module.exports = {\"version\":\"0.1.0\"};",
              "type": "blob"
            }
          },
          "progenitor": {
            "url": "http://strd6.github.io/editor/"
          },
          "version": "0.1.0",
          "entryPoint": "main",
          "repository": {
            "id": 17119562,
            "name": "observable",
            "full_name": "distri/observable",
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
            "html_url": "https://github.com/distri/observable",
            "description": "",
            "fork": false,
            "url": "https://api.github.com/repos/distri/observable",
            "forks_url": "https://api.github.com/repos/distri/observable/forks",
            "keys_url": "https://api.github.com/repos/distri/observable/keys{/key_id}",
            "collaborators_url": "https://api.github.com/repos/distri/observable/collaborators{/collaborator}",
            "teams_url": "https://api.github.com/repos/distri/observable/teams",
            "hooks_url": "https://api.github.com/repos/distri/observable/hooks",
            "issue_events_url": "https://api.github.com/repos/distri/observable/issues/events{/number}",
            "events_url": "https://api.github.com/repos/distri/observable/events",
            "assignees_url": "https://api.github.com/repos/distri/observable/assignees{/user}",
            "branches_url": "https://api.github.com/repos/distri/observable/branches{/branch}",
            "tags_url": "https://api.github.com/repos/distri/observable/tags",
            "blobs_url": "https://api.github.com/repos/distri/observable/git/blobs{/sha}",
            "git_tags_url": "https://api.github.com/repos/distri/observable/git/tags{/sha}",
            "git_refs_url": "https://api.github.com/repos/distri/observable/git/refs{/sha}",
            "trees_url": "https://api.github.com/repos/distri/observable/git/trees{/sha}",
            "statuses_url": "https://api.github.com/repos/distri/observable/statuses/{sha}",
            "languages_url": "https://api.github.com/repos/distri/observable/languages",
            "stargazers_url": "https://api.github.com/repos/distri/observable/stargazers",
            "contributors_url": "https://api.github.com/repos/distri/observable/contributors",
            "subscribers_url": "https://api.github.com/repos/distri/observable/subscribers",
            "subscription_url": "https://api.github.com/repos/distri/observable/subscription",
            "commits_url": "https://api.github.com/repos/distri/observable/commits{/sha}",
            "git_commits_url": "https://api.github.com/repos/distri/observable/git/commits{/sha}",
            "comments_url": "https://api.github.com/repos/distri/observable/comments{/number}",
            "issue_comment_url": "https://api.github.com/repos/distri/observable/issues/comments/{number}",
            "contents_url": "https://api.github.com/repos/distri/observable/contents/{+path}",
            "compare_url": "https://api.github.com/repos/distri/observable/compare/{base}...{head}",
            "merges_url": "https://api.github.com/repos/distri/observable/merges",
            "archive_url": "https://api.github.com/repos/distri/observable/{archive_format}{/ref}",
            "downloads_url": "https://api.github.com/repos/distri/observable/downloads",
            "issues_url": "https://api.github.com/repos/distri/observable/issues{/number}",
            "pulls_url": "https://api.github.com/repos/distri/observable/pulls{/number}",
            "milestones_url": "https://api.github.com/repos/distri/observable/milestones{/number}",
            "notifications_url": "https://api.github.com/repos/distri/observable/notifications{?since,all,participating}",
            "labels_url": "https://api.github.com/repos/distri/observable/labels{/name}",
            "releases_url": "https://api.github.com/repos/distri/observable/releases{/id}",
            "created_at": "2014-02-23T23:17:52Z",
            "updated_at": "2014-02-23T23:17:52Z",
            "pushed_at": "2014-02-23T23:17:52Z",
            "git_url": "git://github.com/distri/observable.git",
            "ssh_url": "git@github.com:distri/observable.git",
            "clone_url": "https://github.com/distri/observable.git",
            "svn_url": "https://github.com/distri/observable",
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
            "branch": "v0.1.0",
            "defaultBranch": "master"
          },
          "dependencies": {}
        }
      }
    }
  }
});