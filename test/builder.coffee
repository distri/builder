Builder = require "../main"

describe "Builder", ->
  it "should build haml", (done) ->
    builder = Builder()

    fileData = [
      PACKAGE.source["samples/haml.haml"]
    ]

    builder.build(fileData).then (result) ->
      assert result.distribution["lib/hamlet-runtime"].content
      assert result.distribution["samples/haml"].content
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

  it "should build HTML", (done) ->
    fileData = [{
      path: "template.html"
      content: """
        <div class="main">
          <h1>Test</h1>
          <div class="component"></div>
        </div>
      """
    }]

    builder = Builder()

    builder.build(fileData).then (result) ->
      content = result.distribution["template"].content
      m = {}
      Function("module", "return " + content)(m)
      template =  m.exports

      node = template()
      assert node.childElementCount is 2
      assert node.className is "main"
      done()
    , (errors) ->
      throw errors[0]
    .done()
