import BlockPainter from "./BlockPainter";
import BlockType from "./BlockType";
import Color from "parsegraph-color";
import Rect from "parsegraph-rect";
import {Matrix3x3} from 'parsegraph-matrix';

export const SIMPLE_THRESHOLD = 5;

export default abstract class AbstractBlockPainter implements BlockPainter {
  private _backgroundColor: Color;
  private _borderColor: Color;
  private _bounds: Rect;
  private _blockType: BlockType;
  private _maxSize: number;
  private _numAllocated: number;
  private _numDrawn: number;

  abstract render(world: Matrix3x3, scale: number): void;

  constructor(blockType: BlockType = BlockType.ROUNDED) {
    // Setup initial uniform values.
    this._backgroundColor = new Color(1, 1, 1, 0.15);
    this._borderColor = new Color(1, 1, 1, 1);

    this._bounds = new Rect(NaN, NaN, NaN, NaN);

    this._blockType = blockType;

    this._maxSize = 0;
    this._numAllocated = 0;
    this._numDrawn = 0;
  }

  initBuffer(numBlocks: number) {
    this._numAllocated = numBlocks;
    this._bounds.toNaN();
    this._maxSize = 0;
    this._numDrawn = 0;
  }

  hasBuffer() {
    return this._numAllocated > 0;
  }

  bounds(): Rect {
    return this._bounds;
  }

  protected includeBounds(x: number, y: number, w: number, h: number) {
    this._bounds.include(x, y, w, h);
  }

  borderColor(): Color {
    return this._borderColor;
  }

  blockType() {
    return this._blockType;
  }

  setBlockType(blockType: BlockType) {
    if (this._blockType === blockType) {
      return;
    }
    this._blockType = blockType;
  }

  setBorderColor(borderColor: Color): void {
    this._borderColor = borderColor;
  }

  backgroundColor(): Color {
    return this._backgroundColor;
  }

  setBackgroundColor(backgroundColor: Color): void {
    this._backgroundColor = backgroundColor;
  }

  clear() {
    this.initBuffer(0);
  }

  usingSimple(scale: number = 1) {
    return (
      this.blockType() === BlockType.SIMPLE ||
      this._maxSize * scale < SIMPLE_THRESHOLD
    );
  }

  drawBlock(
    cx: number,
    cy: number,
    width: number,
    height: number,
    borderRoundedness: number,
    borderThickness: number
  ): void {
    if (typeof cx !== "number" || isNaN(cx)) {
      throw new Error("cx must be a number, but was " + cx);
    }
    if (typeof cy !== "number" || isNaN(cy)) {
      throw new Error("cy must be a number, but was " + cy);
    }
    if (typeof width !== "number" || isNaN(width)) {
      throw new Error("width must be a number, but was " + width);
    }
    if (typeof height !== "number" || isNaN(height)) {
      throw new Error("height must be a number, but was " + height);
    }
    if (typeof borderRoundedness !== "number" || isNaN(borderRoundedness)) {
      throw new Error(
        "borderRoundedness must be a number, but was " + borderRoundedness
      );
    }
    if (typeof borderThickness !== "number" || isNaN(borderThickness)) {
      throw new Error(
        "borderThickness must be a number, but was " + borderThickness
      );
    }
    if (!this.hasBuffer()) {
      throw new Error(
        "BlockPainter.initBuffer(numBlocks) must be called first."
      );
    }
    if (this._numDrawn >= this._numAllocated) {
      throw new Error("BlockPainter is full and cannot draw any more blocks.");
    }
    this.includeBounds(cx, cy, width, height);
    this._maxSize = Math.max(this._maxSize, Math.max(width, height));
    this._numDrawn++;
  }
}
