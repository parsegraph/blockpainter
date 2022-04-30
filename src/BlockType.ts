enum BlockType {
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

export default BlockType;
