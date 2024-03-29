import Color from "parsegraph-color";
import { Matrix3x3 } from "parsegraph-matrix";

import AbstractBlockPainter from "./AbstractBlockPainter";
import BlockType from "./BlockType";

class CanvasBlock {
  cx: number;
  cy: number;
  width: number;
  height: number;
  bgColor: Color;
  borderColor: Color;
  borderRoundness: number;
  borderThickness: number;
  blockType: BlockType;
  dashed: number[]
}

export default class CanvasBlockPainter extends AbstractBlockPainter {
  _ctx: CanvasRenderingContext2D;

  _blocks: CanvasBlock[];

  constructor(
    ctx: CanvasRenderingContext2D,
    blockType: BlockType = BlockType.ROUNDED
  ) {
    super(blockType);
    this._ctx = ctx;
    this._blocks = [];
  }

  clear() {
    super.clear();
    this._blocks = [];
  }

  initBuffer(numBlocks: number) {
    super.initBuffer(numBlocks);
  }

  ctx() {
    return this._ctx;
  }

  drawBlock(
    cx: number,
    cy: number,
    width: number,
    height: number,
    borderRoundness: number,
    borderThickness: number,
    dashed: number[] = null
  ): void {
    super.drawBlock(cx, cy, width, height, borderRoundness, borderThickness);

    this._blocks.push({
      cx,
      cy,
      width,
      height,
      borderRoundness: borderRoundness / 2,
      borderThickness: borderThickness / 2,
      blockType: this.blockType(),
      bgColor: this.backgroundColor(),
      borderColor: this.borderColor(),
      dashed
    });
  }

  strokeRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx();
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  render(_: Matrix3x3, scale: number = 1) {
    const ctx = this.ctx();
    this._blocks.forEach((block) => {
      if (this.usingSimple(scale)) {
        ctx.fillStyle = block.bgColor.asRGBA();
        const { cx, cy, width, height } = block;
        ctx.fillRect(cx - width / 2, cy - height / 2, width, height);
      } else {
        const {
          cx,
          cy,
          width,
          height,
          bgColor,
          borderColor,
          borderRoundness,
          borderThickness,
        } = block;
        ctx.fillStyle = bgColor.asRGBA();
        if (block.dashed) {
          ctx.setLineDash(block.dashed);
        } else {
          ctx.setLineDash([]);
        }
        this.strokeRoundedRect(
          cx + borderThickness / 2 - width / 2,
          cy + borderThickness / 2 - height / 2,
          width - borderThickness,
          height - borderThickness,
          borderRoundness
        );
        ctx.fill();
        if (borderThickness > 0) {
          ctx.strokeStyle = borderColor.asRGBA();
          ctx.lineWidth = borderThickness;
          this.strokeRoundedRect(
            cx + borderThickness / 2 - width / 2,
            cy + borderThickness / 2 - height / 2,
            width - borderThickness,
            height - borderThickness,
            borderRoundness
          );
          ctx.stroke();
        }
      }
    });
  }
}
