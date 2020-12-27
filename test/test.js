var assert = require("assert");
import BlockPainter from "../dist/blockpainter";
import {BasicGLProvider} from 'parsegraph-compileprogram';

import {mockDOM} from 'node-canvas-webgl';
mockDOM(window);

describe("Package", function () {
  it("works", ()=>{
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp);
    bp.initBuffer(1);
    bp.drawBlock(.5, .5, .25, .25, .5, .5, .5);
    const gl = ctx.gl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    ctx.container().style.width = "100%";
    ctx.container().style.height = "100%";
    gl.viewport(0, 0, 400, 400);
    ctx.render();
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0, false);
  });
});
