var assert = require("assert");
import todo from "../dist/blockpainter";

describe("Package", function () {
  it("works", ()=>{
    assert.equal(todo(), 42);
  });
});
