window["distri/builder:master"]({
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
      "content": "\n\nMove adding dependencies to a post processor.\n\nPipes instead of deferred for post processors.\n",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "mode": "100644",
      "content": "Builder\n=======\n\nThe builder knows how to compile a source tree or individual files into various\nbuild products.\n\nTODO: Should the builder be part of the packager?\n\nHelpers\n-------\n    CSON = require \"cson\"\n\n    Deferred = $.Deferred\n\n    arrayToHash = (array) ->\n      array.reduce (hash, file) ->\n        hash[file.path] = file\n        hash\n      , {}\n\n    extend = (target, sources...) ->\n      for source in sources\n        for name of source\n          target[name] = source[name]\n\n      return target\n\n    fileExtension = (str) ->\n      if match = str.match(/\\.([^\\.]*)$/, '')\n        match[match.length - 1]\n      else\n        ''\n\n    withoutExtension = (str) ->\n      str.replace(/\\.[^\\.]*$/,\"\")\n\n`stripMarkdown` converts a literate file into pure code for compilation or execution.\n\n    stripMarkdown = (content) ->\n      content.split(\"\\n\").map (line) ->\n        if match = (/^([ ]{4}|\\t)/).exec line\n          line[match[0].length..]\n        else\n          \"\"\n      .join(\"\\n\")\n\n`compileTemplate` compiles a haml file into a HAMLjr program.\n\n    compileTemplate = (source) ->\n      \"\"\"\n        module.exports = Function(\"return \" + HAMLjr.compile(#{JSON.stringify(source)}, {compiler: CoffeeScript}))()\n      \"\"\"\n\n`stringData` exports a string of text. When you require a file that exports\nstring data it returns the string for you to use in your code. This is handy for\nCSS or other textually based data.\n\n    stringData = (source) ->\n      \"module.exports = #{JSON.stringify(source)};\"\n\n`compileStyl` compiles a styl file into CSS and makes it available as a string\nexport.\n\n    compileStyl = (source) ->\n      styleContent = styl(source, whitespace: true).toString()\n\n      stringData(styleContent)\n\n`compileCoffee` compiles a coffee file into JS and adds the sourceURL comment.\n\nTODO: Work with the require component to make the sourceURL unique for files in\nmodules.\n\n    compileCoffee = (source, path) ->\n      \"\"\"\n        #{CoffeeScript.compile(source)}\n        //# sourceURL=#{path}\n      \"\"\"\n\n`compileFile` take a fileData and returns a buildData. A buildData has a `path`,\nand properties for what type of content was built.\n\nTODO: Allow for files to generate docs and code at the same time.\n\n    compileFile = ({path, content}) ->\n      [name, extension] = [withoutExtension(path), fileExtension(path)]\n\n      result =\n        switch extension\n          when \"js\"\n            code: content\n          when \"json\"\n            code: stringData(JSON.parse(content))\n          when \"cson\"\n            code: stringData(CSON.parse(content))\n          when \"coffee\"\n            code: compileCoffee(content, path)\n          when \"haml\"\n            code: compileTemplate(content, name)\n          when \"styl\"\n            code: compileStyl(content)\n          when \"css\"\n            code: stringData(content)\n          when \"md\"\n            # Separate out code and call compile again\n            compileFile\n              path: name\n              content: stripMarkdown(content)\n          else\n            {}\n\n      result.name ?= name\n      result.extension ?= extension\n\n      extend result,\n        path: path\n\nBuilder\n-------\n\nThe builder instance.\n\nTODO: Standardize interface to use promises or pipes.\n\n    Builder = ->\n      build = (fileData) ->\n        results = fileData.map ({path, content}) ->\n          try\n            # TODO: Separate out tests\n\n            compileFile\n              path: path\n              content: content\n          catch {location, message}\n            if location?\n              message = \"Error on line #{location.first_line + 1}: #{message}\"\n\n            error: \"#{path} - #{message}\"\n\n        errors = results.filter (result) -> result.error\n        data = results.filter (result) -> !result.error\n\n        if errors.length\n          Deferred().reject(errors.map (e) -> e.error)\n        else\n          Deferred().resolve(data)\n\nPost processors operate on the built package.\n\nTODO: Maybe we should split post processors into the packager.\n\n      postProcessors = []\n\n      addPostProcessor: (fn) ->\n        postProcessors.push fn\n\nCompile and build a tree of file data into a distribution. The distribution should\ninclude source files, compiled files, and documentation.\n\n      build: (fileData, cache={}) ->\n        build(fileData)\n        .then (items) ->\n\n          results =\n            items.filter (item) ->\n              item.code\n            .map (item) ->\n              path: item.name\n              content: item.code\n              type: \"blob\"\n\n          source = arrayToHash(fileData)\n\n          pkg =\n            source: source\n            distribution: arrayToHash(results)\n\n          postProcessors.forEach (fn) ->\n            fn(pkg)\n\n          return pkg\n\n    module.exports = Builder\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.3.2\"\nentryPoint: \"main\"\nremoteDependencies: [\n  \"https://code.jquery.com/jquery-1.10.1.min.js\"\n  \"https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"\n]\ndependencies:\n  cson: \"distri/cson:v0.1.0\"\n",
      "type": "blob"
    },
    "test/builder.coffee": {
      "path": "test/builder.coffee",
      "mode": "100644",
      "content": "global.require = require\nglobal.PACKAGE = PACKAGE\n\nBuilder = require \"../main\"\n\ndescribe \"Builder\", ->\n  it \"should exist\", ->\n    assert Builder\n\n  it \"should build\", ->\n    builder = Builder()\n\n    fileData = Object.keys(PACKAGE.source).map (path) ->\n      PACKAGE.source[path]\n\n    builder.build(fileData).then (result) ->\n      console.log \"wat\"\n      console.log result\n    , (errors) ->\n      console.log errors\n",
      "type": "blob"
    }
  },
  "distribution": {
    "main": {
      "path": "main",
      "content": "(function() {\n  var Builder, CSON, Deferred, arrayToHash, compileCoffee, compileFile, compileStyl, compileTemplate, extend, fileExtension, stringData, stripMarkdown, withoutExtension,\n    __slice = [].slice;\n\n  CSON = require(\"cson\");\n\n  Deferred = $.Deferred;\n\n  arrayToHash = function(array) {\n    return array.reduce(function(hash, file) {\n      hash[file.path] = file;\n      return hash;\n    }, {});\n  };\n\n  extend = function() {\n    var name, source, sources, target, _i, _len;\n    target = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = sources.length; _i < _len; _i++) {\n      source = sources[_i];\n      for (name in source) {\n        target[name] = source[name];\n      }\n    }\n    return target;\n  };\n\n  fileExtension = function(str) {\n    var match;\n    if (match = str.match(/\\.([^\\.]*)$/, '')) {\n      return match[match.length - 1];\n    } else {\n      return '';\n    }\n  };\n\n  withoutExtension = function(str) {\n    return str.replace(/\\.[^\\.]*$/, \"\");\n  };\n\n  stripMarkdown = function(content) {\n    return content.split(\"\\n\").map(function(line) {\n      var match;\n      if (match = /^([ ]{4}|\\t)/.exec(line)) {\n        return line.slice(match[0].length);\n      } else {\n        return \"\";\n      }\n    }).join(\"\\n\");\n  };\n\n  compileTemplate = function(source) {\n    return \"module.exports = Function(\\\"return \\\" + HAMLjr.compile(\" + (JSON.stringify(source)) + \", {compiler: CoffeeScript}))()\";\n  };\n\n  stringData = function(source) {\n    return \"module.exports = \" + (JSON.stringify(source)) + \";\";\n  };\n\n  compileStyl = function(source) {\n    var styleContent;\n    styleContent = styl(source, {\n      whitespace: true\n    }).toString();\n    return stringData(styleContent);\n  };\n\n  compileCoffee = function(source, path) {\n    return \"\" + (CoffeeScript.compile(source)) + \"\\n//# sourceURL=\" + path;\n  };\n\n  compileFile = function(_arg) {\n    var content, extension, name, path, result, _ref;\n    path = _arg.path, content = _arg.content;\n    _ref = [withoutExtension(path), fileExtension(path)], name = _ref[0], extension = _ref[1];\n    result = (function() {\n      switch (extension) {\n        case \"js\":\n          return {\n            code: content\n          };\n        case \"json\":\n          return {\n            code: stringData(JSON.parse(content))\n          };\n        case \"cson\":\n          return {\n            code: stringData(CSON.parse(content))\n          };\n        case \"coffee\":\n          return {\n            code: compileCoffee(content, path)\n          };\n        case \"haml\":\n          return {\n            code: compileTemplate(content, name)\n          };\n        case \"styl\":\n          return {\n            code: compileStyl(content)\n          };\n        case \"css\":\n          return {\n            code: stringData(content)\n          };\n        case \"md\":\n          return compileFile({\n            path: name,\n            content: stripMarkdown(content)\n          });\n        default:\n          return {};\n      }\n    })();\n    if (result.name == null) {\n      result.name = name;\n    }\n    if (result.extension == null) {\n      result.extension = extension;\n    }\n    return extend(result, {\n      path: path\n    });\n  };\n\n  Builder = function() {\n    var build, postProcessors;\n    build = function(fileData) {\n      var data, errors, results;\n      results = fileData.map(function(_arg) {\n        var content, location, message, path;\n        path = _arg.path, content = _arg.content;\n        try {\n          return compileFile({\n            path: path,\n            content: content\n          });\n        } catch (_error) {\n          location = _error.location, message = _error.message;\n          if (location != null) {\n            message = \"Error on line \" + (location.first_line + 1) + \": \" + message;\n          }\n          return {\n            error: \"\" + path + \" - \" + message\n          };\n        }\n      });\n      errors = results.filter(function(result) {\n        return result.error;\n      });\n      data = results.filter(function(result) {\n        return !result.error;\n      });\n      if (errors.length) {\n        return Deferred().reject(errors.map(function(e) {\n          return e.error;\n        }));\n      } else {\n        return Deferred().resolve(data);\n      }\n    };\n    postProcessors = [];\n    return {\n      addPostProcessor: function(fn) {\n        return postProcessors.push(fn);\n      },\n      build: function(fileData, cache) {\n        if (cache == null) {\n          cache = {};\n        }\n        return build(fileData).then(function(items) {\n          var pkg, results, source;\n          results = items.filter(function(item) {\n            return item.code;\n          }).map(function(item) {\n            return {\n              path: item.name,\n              content: item.code,\n              type: \"blob\"\n            };\n          });\n          source = arrayToHash(fileData);\n          pkg = {\n            source: source,\n            distribution: arrayToHash(results)\n          };\n          postProcessors.forEach(function(fn) {\n            return fn(pkg);\n          });\n          return pkg;\n        });\n      }\n    };\n  };\n\n  module.exports = Builder;\n\n}).call(this);\n\n//# sourceURL=main.coffee",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.3.2\",\"entryPoint\":\"main\",\"remoteDependencies\":[\"https://code.jquery.com/jquery-1.10.1.min.js\",\"https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"],\"dependencies\":{\"cson\":\"distri/cson:v0.1.0\"}};",
      "type": "blob"
    },
    "test/builder": {
      "path": "test/builder",
      "content": "(function() {\n  var Builder;\n\n  global.require = require;\n\n  global.PACKAGE = PACKAGE;\n\n  Builder = require(\"../main\");\n\n  describe(\"Builder\", function() {\n    it(\"should exist\", function() {\n      return assert(Builder);\n    });\n    return it(\"should build\", function() {\n      var builder, fileData;\n      builder = Builder();\n      fileData = Object.keys(PACKAGE.source).map(function(path) {\n        return PACKAGE.source[path];\n      });\n      return builder.build(fileData).then(function(result) {\n        console.log(\"wat\");\n        return console.log(result);\n      }, function(errors) {\n        return console.log(errors);\n      });\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/builder.coffee",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "version": "0.3.2",
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
    "updated_at": "2014-02-11T19:10:44Z",
    "pushed_at": "2014-02-11T19:10:43Z",
    "git_url": "git://github.com/distri/builder.git",
    "ssh_url": "git@github.com:distri/builder.git",
    "clone_url": "https://github.com/distri/builder.git",
    "svn_url": "https://github.com/distri/builder",
    "homepage": null,
    "size": 224,
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
    }
  }
});