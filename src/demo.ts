import Color from "parsegraph-color";
import { BasicGLProvider, GLProvider } from "parsegraph-compileprogram";
import BlockPainter, { WebGLBlockPainter, readBlockType } from "./index";

let ctx: GLProvider = null;
let bp: BlockPainter = null;

function getFormValue(name: string) {
  const form = document.forms[0];
  const val = form[name].valueAsNumber;
  const label = form[name].nextElementSibling;
  label.innerHTML = name + "=" + val;
  return val;
}

function redraw() {
  requestAnimationFrame(() => {
    if (!bp) {
      bp = new WebGLBlockPainter(ctx);
    }
    bp.initBuffer(1);

    const cx = getFormValue("cx");
    const cy = getFormValue("cy");
    const width = getFormValue("width");
    const height = getFormValue("height");
    const borderRoundness = getFormValue("borderRoundness");
    const borderThickness = getFormValue("borderThickness");
    const blockTypeField = document.getElementById(
      "blocktype"
    ) as HTMLInputElement;
    bp.setBlockType(readBlockType(blockTypeField.value));
    bp.setBackgroundColor(new Color(1, 1, 0, 1));
    bp.setBorderColor(new Color(1, 0, 0, 1));
    bp.drawBlock(cx, cy, width, height, borderRoundness, borderThickness);
    const gl = ctx.gl();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    ctx.container().style.width = "100%";
    ctx.container().style.height = "100%";
    gl.viewport(0, 0, 400, 400);
    ctx.render();
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  ctx = new BasicGLProvider();
  document.getElementById("gl").appendChild(ctx.container());
  document.querySelectorAll("form input").forEach((elem) => {
    elem.addEventListener("input", redraw);
  });
  document.querySelectorAll("form select").forEach((elem) => {
    elem.addEventListener("change", redraw);
  });
  redraw();
});
