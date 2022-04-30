import Color from "parsegraph-color";
import Rect from "parsegraph-rect";

import { Matrix3x3 } from "parsegraph-matrix";

export enum BlockType {
  SIMPLE,
  ROUNDED,
  SQUARE,
  ANGLE,
  PARENTHESIS,
  CURLY,
}

export function nameBlockType(t: BlockType) {
  switch (t) {
    case BlockType.CURLY:
      return "CURLY";
    case BlockType.ROUNDED:
      return "ROUNDED";
    case BlockType.PARENTHESIS:
      return "PARENTHESIS";
    case BlockType.ANGLE:
      return "ANGLE";
    case BlockType.SQUARE:
      return "SQUARE";
    case BlockType.SIMPLE:
      return "SIMPLE";
  }
}

export function readBlockType(g: string) {
  switch (g) {
    case "ROUNDED":
      return BlockType.ROUNDED;
    case "CURLY":
      return BlockType.CURLY;
    case "PARENTHESIS":
      return BlockType.PARENTHESIS;
    case "ANGLE":
      return BlockType.ANGLE;
    case "SQUARE":
      return BlockType.SQUARE;
    case "SIMPLE":
      return BlockType.SIMPLE;
  }
}

export const SIMPLE_THRESHOLD = 5;

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
