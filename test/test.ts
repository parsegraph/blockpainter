var assert = require("assert");
import BlockPainter from "../src/index";
import { BasicGLProvider } from "parsegraph-compileprogram";
import Color from "parsegraph-color";

import { mockDOM } from "node-canvas-webgl";
mockDOM(window);

describe("BlockPainter", function () {
  it("works", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp);
    bp.initBuffer(2);
    bp.drawBlock(0.5, 0.5, 0.5, 0.25, 0.5, 0.5, 0.5);
    bp.drawBlock(0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5);
    const gl = ctx.gl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    ctx.container().style.width = "100%";
    ctx.container().style.height = "100%";
    gl.viewport(0, 0, 400, 400);
    ctx.render();
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0, false);
  });
  it("has a simple mode", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp);
    bp.initBuffer(1);
    bp.drawBlock(0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5);
    const gl = ctx.gl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    ctx.container().style.width = "100%";
    ctx.container().style.height = "100%";
    gl.viewport(0, 0, 400, 400);
    ctx.render();
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0, true);
  });
  it("has idempotent initBuffer", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp);
    bp.initBuffer(1);
    bp.initBuffer(1);
    bp.drawBlock(0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5);
    const gl = ctx.gl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    ctx.container().style.width = "100%";
    ctx.container().style.height = "100%";
    gl.viewport(0, 0, 400, 400);
    ctx.render();
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0, true);
  });
  it("can be cleared", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp);
    bp.initBuffer(1);
    bp.drawBlock(0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5);
    bp.clear();
    bp.initBuffer(1);
    const gl = ctx.gl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    ctx.container().style.width = "100%";
    ctx.container().style.height = "100%";
    gl.viewport(0, 0, 400, 400);
    ctx.render();
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0, true);
  });
  it("can be resized", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp);
    bp.initBuffer(1);
    bp.drawBlock(0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5);
    bp.initBuffer(2);
    const gl = ctx.gl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    ctx.container().style.width = "100%";
    ctx.container().style.height = "100%";
    gl.viewport(0, 0, 400, 400);
    ctx.render();
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0, true);
  });
  it("can be changed in color", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp);
    bp.initBuffer(1);
    bp.drawBlock(0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5);
    bp.initBuffer(2);
    const gl = ctx.gl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    ctx.container().style.width = "100%";
    ctx.container().style.height = "100%";
    bp.setBackgroundColor(new Color(1, 1, 0, 1));
    bp.setBorderColor(new Color(1, 0, 0, 1));
    gl.viewport(0, 0, 400, 400);
    ctx.render();
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0, true);
  });
  it("keeps track of its own bounds", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    bp.initBuffer(2);
    bp.drawBlock(0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5);
    assert.ok(bp.bounds());
    bp.drawBlock(0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5);
    assert.ok(bp.bounds());
  });
  it("has an ID", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp.id());
  });
  it("supports toString", () => {
    let ctx = new BasicGLProvider();
    ctx.setExplicitSize(400, 400);
    const bp = new BlockPainter(ctx);
    assert.ok(bp.toString());
  });
});