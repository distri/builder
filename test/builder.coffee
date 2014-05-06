global.require = require
global.PACKAGE = PACKAGE

Builder = require "../main"

describe "Builder", ->
  it "should exist", ->
    assert Builder

  it "should build", ->
    builder = Builder()

    fileData = Object.keys(PACKAGE.source).map (path) ->
      PACKAGE.source[path]

    builder.build(fileData).then (result) ->
      console.log result
    , (errors) ->
      throw errors[0]

  it "should build haml", (done) ->
    builder = Builder()

    fileData = Object.keys(PACKAGE.source).map (path) ->
      PACKAGE.source[path]

    builder.build(fileData).then (result) ->
      assert result.distribution["lib/_hamljr_runtime"].content
      assert result.distribution["samples/haml"].content
      done()
    , (errors) ->
      throw errors[0]
