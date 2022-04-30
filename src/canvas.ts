import Color from "parsegraph-color";
import BlockPainter, { CanvasBlockPainter, readBlockType } from "./index";

let ctx: CanvasRenderingContext2D = null;
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
      bp = new CanvasBlockPainter(ctx);
    }
    bp.initBuffer(1);

    const cx = getFormValue("cx");
    const cy = getFormValue("cy");
    const width = getFormValue("width");
    const height = getFormValue("height");
    const borderRoundedness = getFormValue("borderRoundedness");
    const borderThickness = getFormValue("borderThickness");
    const blockTypeField = document.getElementById(
      "blocktype"
    ) as HTMLInputElement;
    bp.setBlockType(readBlockType(blockTypeField.value));
    bp.setBackgroundColor(new Color(1, 1, 0, 1));
    bp.setBorderColor(new Color(1, 0, 0, 1));
    bp.drawBlock(cx, cy, width, height, borderRoundedness, borderThickness);
    ctx.canvas.width = 400;
    ctx.canvas.height = 400;
    ctx.resetTransform();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.canvas.style.width = "100%";
    ctx.canvas.style.height = "100%";
    bp.render([1, 0, 0, 0, 1, 0, 0, 0, 1], 1000.0);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  document.getElementById("gl").appendChild(canvas);
  document.querySelectorAll("form input").forEach((elem) => {
    elem.addEventListener("input", redraw);
  });
  document.querySelectorAll("form select").forEach((elem) => {
    elem.addEventListener("change", redraw);
  });
  redraw();
});
