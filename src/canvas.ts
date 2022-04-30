import Color from "parsegraph-color";
import BlockPainter, { CanvasBlockPainter, readBlockType } from "./index";

let ctx: CanvasRenderingContext2D = null;
let bp: BlockPainter = null;

const SIZE = 400;

function getFormValue(name: string) {
  const form = document.forms[0];
  const val = form[name].valueAsNumber;
  const label = form[name].nextElementSibling;
  label.innerHTML = name + "=" + val;
  return val;
}

function redraw() {
  requestAnimationFrame(() => {
    console.log("Drawing");
    if (!bp) {
      bp = new CanvasBlockPainter(ctx);
    }
    bp.clear();
    bp.initBuffer(1);

    const cx = getFormValue("cx");
    const cy = getFormValue("cy");
    const width = getFormValue("width");
    const height = getFormValue("height");
    console.log(width, height);
    const borderRoundness = getFormValue("borderRoundness");
    const borderThickness = getFormValue("borderThickness");
    const blockTypeField = document.getElementById(
      "blocktype"
    ) as HTMLInputElement;
    bp.setBlockType(readBlockType(blockTypeField.value));
    bp.setBackgroundColor(new Color(1, 1, 0, 1));
    bp.setBorderColor(new Color(1, 0, 0, 1));
    bp.drawBlock(
      cx,
      cy,
      (width * SIZE) / 2,
      (height * SIZE) / 2,
      (width * SIZE * borderRoundness) / 2,
      (width * SIZE * borderThickness) / 2
    );
    ctx.canvas.style.width = "100%";
    ctx.canvas.style.height = "100%";
    ctx.canvas.width = SIZE;
    ctx.canvas.height = SIZE;
    ctx.resetTransform();
    ctx.translate(SIZE / 2, SIZE / 2);
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
