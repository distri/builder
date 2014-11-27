global.require = require
global.PACKAGE = PACKAGE

Builder = require "../main"

describe "Builder", ->
  it "should exist", ->
    assert Builder

  it "should build haml", (done) ->
    builder = Builder()

    fileData = [
      PACKAGE.source["samples/haml.haml"]
    ]

    builder.build(fileData).then (result) ->
      assert result.distribution["lib/hamlet-runtime"].content
      assert result.distribution["samples/haml"].content.match(/module\.exports =/)

      done()
    , (errors) ->
      throw errors[0]
    .done()

  it "should build styl", (done) ->
    builder = Builder()

    fileData = [
      PACKAGE.source["samples/styl.styl"]
    ]

    builder.build(fileData).then (result) ->
      assert result.distribution["samples/styl"].content
      done()
    , (errors) ->
      throw errors[0]
    .done()

  it "should have the Hamlet runtime", ->
    assert require "/lib/hamlet-runtime"

  it "should have the Hamlet compiler", ->
    assert require "/lib/hamlet-runtime"
