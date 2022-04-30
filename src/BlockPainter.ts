import Color from "parsegraph-color";
import Rect from "parsegraph-rect";
import { Matrix3x3 } from "parsegraph-matrix";

import BlockType from "./BlockType";

export default interface BlockPainter {
  bounds(): Rect;
  borderColor(): Color;
  blockType(): BlockType;
  setBlockType(blockType: BlockType): void;
  setBorderColor(borderColor: Color): void;
  backgroundColor(): Color;
  setBackgroundColor(backgroundColor: Color): void;
  hasBuffer(): boolean;
  initBuffer(numBlocks: number): void;
  clear(): void;
  drawBlock(
    cx: number,
    cy: number,
    width: number,
    height: number,
    borderRoundedness: number,
    borderThickness: number
  ): void;
  usingSimple(scale: number): boolean;
  render(world: Matrix3x3, scale: number): void;
}
