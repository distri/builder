global.require = require
global.PACKAGE = PACKAGE

Builder = require "../main"

describe "Builder", ->
  it "should exist", ->
    assert Builder
