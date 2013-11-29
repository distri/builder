(function(pkg) {
  // Expose a require for our package so scripts can access our modules
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
      "content": "\n\nMove adding dependencies to a post processor.\n\nPipes instead of deferred for post processors.\n",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "mode": "100644",
      "content": "Builder\n=======\n\nThe builder knows how to compile a source tree or individual files into various\nbuild products.\n\nTODO: Should the builder be part of the packager?\n\nHelpers\n-------\n\n    arrayToHash = (array) ->\n      array.reduce (hash, file) ->\n        hash[file.path] = file\n        hash\n      , {}\n\n`stripMarkdown` converts a literate file into pure code for compilation or execution.\n\n    stripMarkdown = (content) ->\n      content.split(\"\\n\").map (line) ->\n        if match = (/^([ ]{4}|\\t)/).exec line\n          line[match[0].length..]\n        else\n          \"\"\n      .join(\"\\n\")\n\n`compileTemplate` compiles a haml file into a HAMLjr program.\n\n    compileTemplate = (source) ->\n      \"\"\"\n        module.exports = Function(\"return \" + HAMLjr.compile(#{JSON.stringify(source)}, {compiler: CoffeeScript}))()\n      \"\"\"\n\n`stringData` exports a string of text. When you require a file that exports\nstring data it returns the string for you to use in your code. This is handy for\nCSS or other textually based data.\n\n    stringData = (source) ->\n      \"module.exports = #{JSON.stringify(source)};\"\n\n`compileStyl` compiles a styl file into CSS and makes it available as a string\nexport.\n\n    compileStyl = (source) ->\n      styleContent = styl(source, whitespace: true).toString()\n\n      stringData(styleContent)\n\n`compileCoffee` compiles a coffee file into JS and adds the sourceURL comment.\n\nTODO: Work with the require component to make the sourceURL unique for files in\nmodules.\n\n    compileCoffee = (source, path) ->\n      \"\"\"\n        #{CoffeeScript.compile(source)}\n        //# sourceURL=#{path}\n      \"\"\"\n\n`compileFile` take a fileData and returns a buildData. A buildData has a `path`,\nand properties for what type of content was built.\n\nTODO: Allow for files to generate docs and code at the same time.\n\n    compileFile = ({path, content}) ->\n      [name, extension] = [path.withoutExtension(), path.extension()]\n\n      result =\n        switch extension\n          when \"js\"\n            code: content\n          when \"json\"\n            code: stringData(JSON.parse(content))\n          when \"cson\"\n            code: stringData(CSON.parse(content))\n          when \"coffee\"\n            code: compileCoffee(content, path)\n          when \"haml\"\n            code: compileTemplate(content, name)\n          when \"styl\"\n            code: compileStyl(content)\n          when \"css\"\n            code: stringData(content)\n          when \"md\"\n            # Separate out code and call compile again\n            compileFile\n              path: name\n              content: stripMarkdown(content)\n          else\n            {}\n\n      Object.defaults result,\n        name: name\n        extension: extension\n\n      Object.extend result,\n        path: path\n\nBuilder\n-------\n\nThe builder instance.\n\nTODO: Standardize interface to use promises or pipes.\n\n    Builder = ->\n      build = (fileData) ->\n        results = fileData.map ({path, content}) ->\n          try\n            # TODO: Separate out tests\n\n            compileFile\n              path: path\n              content: content\n          catch {location, message}\n            if location?\n              message = \"Error on line #{location.first_line + 1}: #{message}\"\n\n            error: \"#{path} - #{message}\"\n\n        [errors, data] = results.partition (result) -> result.error\n\n        if errors.length\n          Deferred().reject(errors.map (e) -> e.error)\n        else\n          Deferred().resolve(data)\n\nPost processors operate on the built package.\n\nTODO: Maybe we should split post processors into the packager.\n\n      postProcessors = []\n\n      addPostProcessor: (fn) ->\n        postProcessors.push fn\n\nCompile and build a tree of file data into a distribution. The distribution should\ninclude source files, compiled files, and documentation.\n\n      build: (fileData, cache={}) ->\n        build(fileData)\n        .then (items) ->\n          results = []\n\n          items.eachWithObject results, (item, hash) ->\n            if item.code\n              results.push item\n            else\n              # Do nothing, we don't know about this item\n\n          results = results.map (item) ->\n            path: item.name\n            content: item.code\n            type: \"blob\"\n\n          source = arrayToHash(fileData)\n\n          pkg =\n            source: source\n            distribution: arrayToHash(results)\n\n          postProcessors.forEach (fn) ->\n            fn(pkg)\n\n          return pkg\n\n    module.exports = Builder\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.3.1\"\nentryPoint: \"main\"\n",
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
      "content": "(function() {\n  var Builder, arrayToHash, compileCoffee, compileFile, compileStyl, compileTemplate, stringData, stripMarkdown;\n\n  arrayToHash = function(array) {\n    return array.reduce(function(hash, file) {\n      hash[file.path] = file;\n      return hash;\n    }, {});\n  };\n\n  stripMarkdown = function(content) {\n    return content.split(\"\\n\").map(function(line) {\n      var match;\n      if (match = /^([ ]{4}|\\t)/.exec(line)) {\n        return line.slice(match[0].length);\n      } else {\n        return \"\";\n      }\n    }).join(\"\\n\");\n  };\n\n  compileTemplate = function(source) {\n    return \"module.exports = Function(\\\"return \\\" + HAMLjr.compile(\" + (JSON.stringify(source)) + \", {compiler: CoffeeScript}))()\";\n  };\n\n  stringData = function(source) {\n    return \"module.exports = \" + (JSON.stringify(source)) + \";\";\n  };\n\n  compileStyl = function(source) {\n    var styleContent;\n    styleContent = styl(source, {\n      whitespace: true\n    }).toString();\n    return stringData(styleContent);\n  };\n\n  compileCoffee = function(source, path) {\n    return \"\" + (CoffeeScript.compile(source)) + \"\\n//# sourceURL=\" + path;\n  };\n\n  compileFile = function(_arg) {\n    var content, extension, name, path, result, _ref;\n    path = _arg.path, content = _arg.content;\n    _ref = [path.withoutExtension(), path.extension()], name = _ref[0], extension = _ref[1];\n    result = (function() {\n      switch (extension) {\n        case \"js\":\n          return {\n            code: content\n          };\n        case \"json\":\n          return {\n            code: stringData(JSON.parse(content))\n          };\n        case \"cson\":\n          return {\n            code: stringData(CSON.parse(content))\n          };\n        case \"coffee\":\n          return {\n            code: compileCoffee(content, path)\n          };\n        case \"haml\":\n          return {\n            code: compileTemplate(content, name)\n          };\n        case \"styl\":\n          return {\n            code: compileStyl(content)\n          };\n        case \"css\":\n          return {\n            code: stringData(content)\n          };\n        case \"md\":\n          return compileFile({\n            path: name,\n            content: stripMarkdown(content)\n          });\n        default:\n          return {};\n      }\n    })();\n    Object.defaults(result, {\n      name: name,\n      extension: extension\n    });\n    return Object.extend(result, {\n      path: path\n    });\n  };\n\n  Builder = function() {\n    var build, postProcessors;\n    build = function(fileData) {\n      var data, errors, results, _ref;\n      results = fileData.map(function(_arg) {\n        var content, location, message, path;\n        path = _arg.path, content = _arg.content;\n        try {\n          return compileFile({\n            path: path,\n            content: content\n          });\n        } catch (_error) {\n          location = _error.location, message = _error.message;\n          if (location != null) {\n            message = \"Error on line \" + (location.first_line + 1) + \": \" + message;\n          }\n          return {\n            error: \"\" + path + \" - \" + message\n          };\n        }\n      });\n      _ref = results.partition(function(result) {\n        return result.error;\n      }), errors = _ref[0], data = _ref[1];\n      if (errors.length) {\n        return Deferred().reject(errors.map(function(e) {\n          return e.error;\n        }));\n      } else {\n        return Deferred().resolve(data);\n      }\n    };\n    postProcessors = [];\n    return {\n      addPostProcessor: function(fn) {\n        return postProcessors.push(fn);\n      },\n      build: function(fileData, cache) {\n        if (cache == null) {\n          cache = {};\n        }\n        return build(fileData).then(function(items) {\n          var pkg, results, source;\n          results = [];\n          items.eachWithObject(results, function(item, hash) {\n            if (item.code) {\n              return results.push(item);\n            } else {\n\n            }\n          });\n          results = results.map(function(item) {\n            return {\n              path: item.name,\n              content: item.code,\n              type: \"blob\"\n            };\n          });\n          source = arrayToHash(fileData);\n          pkg = {\n            source: source,\n            distribution: arrayToHash(results)\n          };\n          postProcessors.forEach(function(fn) {\n            return fn(pkg);\n          });\n          return pkg;\n        });\n      }\n    };\n  };\n\n  module.exports = Builder;\n\n}).call(this);\n\n//# sourceURL=main.coffee",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.3.1\",\"entryPoint\":\"main\"};",
      "type": "blob"
    },
    "test/builder": {
      "path": "test/builder",
      "content": "(function() {\n  var Builder;\n\n  global.require = require;\n\n  global.PACKAGE = PACKAGE;\n\n  Builder = require(\"../main\");\n\n  describe(\"Builder\", function() {\n    return it(\"should exist\", function() {\n      return assert(Builder);\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/builder.coffee",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "version": "0.3.1",
  "entryPoint": "main",
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
    "updated_at": "2013-11-29T19:40:43Z",
    "pushed_at": "2013-11-29T19:40:43Z",
    "git_url": "git://github.com/distri/builder.git",
    "ssh_url": "git@github.com:distri/builder.git",
    "clone_url": "https://github.com/distri/builder.git",
    "svn_url": "https://github.com/distri/builder",
    "homepage": null,
    "size": 600,
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
    "branch": "v0.3.1",
    "defaultBranch": "master"
  },
  "dependencies": {}
});