var assert = require("assert");
import BlockPainter from "../dist/blockpainter";

describe("Package", function () {
  it("works", ()=>{
    assert.ok(new BlockPainter());
  });
});
