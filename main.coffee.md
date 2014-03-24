Builder
=======

The builder knows how to compile a source tree or individual files into various
build products.

Helpers
-------
    CSON = require "cson"
    HamlJr = require "haml-jr"

    Deferred = $.Deferred

    arrayToHash = (array) ->
      array.reduce (hash, file) ->
        hash[file.path] = file
        hash
      , {}

    extend = (target, sources...) ->
      for source in sources
        for name of source
          target[name] = source[name]

      return target

    fileExtension = (str) ->
      if match = str.match(/\.([^\.]*)$/, '')
        match[match.length - 1]
      else
        ''

    withoutExtension = (str) ->
      str.replace(/\.[^\.]*$/,"")

`stripMarkdown` converts a literate file into pure code for compilation or execution.

    stripMarkdown = (content) ->
      content.split("\n").map (line) ->
        if match = (/^([ ]{4}|\t)/).exec line
          line[match[0].length..]
        else
          ""
      .join("\n")

`compileTemplate` compiles a haml file into a HamlJr program.

    compileTemplate = (source) ->
      """
        Runtime = require("/_lib/hamljr_runtime");

        module.exports = #{HamlJr.compile(source, {compiler: CoffeeScript})}
      """

`stringData` exports a string of text. When you require a file that exports
string data it returns the string for you to use in your code. This is handy for
CSS or other textually based data.

    stringData = (source) ->
      "module.exports = #{JSON.stringify(source)};"

`compileStyl` compiles a styl file into CSS and makes it available as a string
export.

    compileStyl = (source) ->
      styleContent = styl(source, whitespace: true).toString()

      stringData(styleContent)

`compileCoffee` compiles a coffee file into JS. The `require` library handles
appending a sourceURL comment to assist in debugging.

    compileCoffee = (source, path) ->
      CoffeeScript.compile(source)

`compileFile` take a fileData and returns a buildData. A buildData has a `path`,
and properties for what type of content was built.

    compileFile = ({path, content}) ->
      [name, extension] = [withoutExtension(path), fileExtension(path)]

      result =
        switch extension
          when "js"
            code: content
          when "json"
            code: stringData(JSON.parse(content))
          when "cson"
            code: stringData(CSON.parse(content))
          when "coffee"
            code: compileCoffee(content, path)
          when "haml"
            code: compileTemplate(content, name)
          when "styl"
            code: compileStyl(content)
          when "css"
            code: stringData(content)
          when "md"
            # Separate out code and call compile again
            compileFile
              path: name
              content: stripMarkdown(content)
          else
            {}

      result.name ?= name
      result.extension ?= extension

      extend result,
        path: path

Builder
-------

The builder instance.

TODO: Standardize interface to use promises or pipes.

    Builder = ->
      build = (fileData) ->
        results = fileData.map ({path, content}) ->
          try
            compileFile
              path: path
              content: content
          catch {location, message}
            if location?
              message = "Error on line #{location.first_line + 1}: #{message}"

            error: "#{path} - #{message}"

        errors = results.filter (result) -> result.error
        data = results.filter (result) -> !result.error

        if errors.length
          Deferred().reject(errors.map (e) -> e.error)
        else
          # Add the HamlJr runtime if any templates were compiled
          hasHaml = fileData.some ({path}) ->
            path.match /.*\.haml(\..*)?$/

          if hasHaml
            data.push
              name: "_lib/hamljr_runtime"
              code: PACKAGE.dependencies["haml-jr"].distribution.runtime.content # Kinda gross

          Deferred().resolve(data)

Post processors operate on the built package.

TODO: Maybe we should split post processors into the packager.

      postProcessors = []

      addPostProcessor: (fn) ->
        postProcessors.push fn

Compile and build a tree of file data into a distribution. The distribution should
include source files, compiled files, and documentation.

      build: (fileData, cache={}) ->
        build(fileData)
        .then (items) ->

          results =
            items.filter (item) ->
              item.code
            .map (item) ->
              path: item.name
              content: item.code
              type: "blob"

          source = arrayToHash(fileData)

          pkg =
            source: source
            distribution: arrayToHash(results)

          postProcessors.forEach (fn) ->
            fn(pkg)

          return pkg

    module.exports = Builder
