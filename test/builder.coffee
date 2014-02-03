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
      console.log "wat"
      console.log result
    , (errors) ->
      console.log errors
