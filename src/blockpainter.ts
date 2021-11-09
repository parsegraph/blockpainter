import {
  compileProgram,
  GLProvider,
  ProxyGLProvider,
  BasicGLProvider,
} from "parsegraph-compileprogram";
import Color from "parsegraph-color";
import Rect from "parsegraph-rect";

import blockPainterVertexShader from "./BlockPainter_VertexShader.glsl";
import blockPainterVertexShaderSimple from "./BlockPainter_VertexShader_Simple.glsl";

// Same as above, but using a better antialiasing technique.
import blockPainterFragmentShaderOESStandardDerivatives from "./BlockPainter_FragmentShader_OES_standard_derivatives.glsl";

import blockPainterFragmentShaderSimple from "./BlockPainter_FragmentShader_Simple.glsl";

import blockPainterRoundedFragmentShader from "./BlockPainter_FragmentShader.glsl";
import blockPainterSquareFragmentShader from "./BlockPainter_SquareFragmentShader.glsl";
import blockPainterAngleFragmentShader from "./BlockPainter_AngleFragmentShader.glsl";
import blockPainterParenthesisFragmentShader from "./BlockPainter_ParenthesisFragmentShader.glsl";
import blockPainterCurlyFragmentShader from "./BlockPainter_CurlyFragmentShader.glsl";

import { Matrix3x3 } from "parsegraph-matrix";

export enum BlockType {
  ROUNDED,
  SQUARE,
  ANGLE,
  PARENTHESIS,
  CURLY,
}

export function nameBlockType(t:BlockType) {
  switch(t) {
    case BlockType.CURLY: return "CURLY";
    case BlockType.ROUNDED: return "ROUNDED";
    case BlockType.PARENTHESIS: return "PARENTHESIS";
    case BlockType.ANGLE: return "ANGLE";
    case BlockType.SQUARE: return "SQUARE";
  }
}

export function readBlockType(g:string) {
  switch(g) {
    case "ROUNDED": return BlockType.ROUNDED;
    case "CURLY": return BlockType.CURLY;
    case "PARENTHESIS": return BlockType.PARENTHESIS;
    case "ANGLE": return BlockType.ANGLE;
    case "SQUARE": return BlockType.SQUARE;
  }
}

export function getBlockPainterShader(
  gl: WebGLRenderingContext,
  blockType: BlockType
) {
  let fragProgram: string;
  switch (blockType) {
    case BlockType.ROUNDED:
      fragProgram = blockPainterRoundedFragmentShader;
      // Avoid OES_standard_derivatives on Firefox.
      if (
        navigator.userAgent.indexOf("Firefox") == -1 &&
        gl.getExtension("OES_standard_derivatives") != null
      ) {
        fragProgram = blockPainterFragmentShaderOESStandardDerivatives;
      }
      break;
    case BlockType.SQUARE:
      fragProgram = blockPainterSquareFragmentShader;
      break;
    case BlockType.ANGLE:
      fragProgram = blockPainterAngleFragmentShader;
      break;
    case BlockType.PARENTHESIS:
      fragProgram = blockPainterParenthesisFragmentShader;
      break;
    case BlockType.CURLY:
      fragProgram = blockPainterCurlyFragmentShader;
      break;
    default:
      throw new Error("Unsupported block type: " + blockType);
  }
  return fragProgram;
}

let blockPainterCount = 0;

export default class BlockPainter extends ProxyGLProvider {
  _id: number;
  _blockBuffer: WebGLBuffer;
  _blockBufferNumVertices: number;
  _blockBufferVertexIndex: number;
  _backgroundColor: Color;
  _borderColor: Color;
  _bounds: Rect;
  _blockProgram: WebGLProgram;
  _blockProgramSimple: WebGLProgram;
  _stride: number;
  _vertexBuffer: Float32Array;
  _dataBufferVertexIndex: number;
  _dataBufferNumVertices: number;
  _dataBuffer: Float32Array;
  _maxSize: number;
  _blockType: BlockType;
  uWorld: WebGLUniformLocation;
  aPosition: number;
  aTexCoord: number;
  aColor: number;
  aBorderColor: number;
  aBorderRoundedness: number;
  aBorderThickness: number;
  aAspectRatio: number;
  simpleUWorld: WebGLUniformLocation;
  simpleAPosition: number;
  simpleAColor: number;

  constructor(window: GLProvider, blockType: BlockType = BlockType.ROUNDED) {
    super(window);
    this._id = blockPainterCount++;

    // Prepare buffer using prepare(numBlocks).
    // BlockPainter supports a fixed number of blocks.

    this._blockBuffer = null;
    this._blockBufferNumVertices = null;
    this._blockBufferVertexIndex = 0;

    // Setup initial uniform values.
    this._backgroundColor = new Color(1, 1, 1, 0.15);
    this._borderColor = new Color(1, 1, 1, 1);

    this._bounds = new Rect(NaN, NaN, NaN, NaN);

    this._blockProgram = null;
    this._blockProgramSimple = null;

    // Position: 2 * 4 (two floats)  0-7
    // TexCoord: 2 * 4 (two floats)  8-15
    // Color:    4 * 4 (four floats) 16-31
    // BorColor: 4 * 4 (four floats) 32-47
    // BorRound: 1 * 4 (one float)   48-51
    // BorThick: 1 * 4 (one float)   52-55
    // AspectRa: 1 * 4 (one float)   56-59
    this._stride = 60;
    this._vertexBuffer = new Float32Array(this._stride / 4);
    this._dataBufferVertexIndex = 0;
    this._dataBufferNumVertices = 6;
    this._dataBuffer = new Float32Array(
      (this._dataBufferNumVertices * this._stride) / 4
    );

    this._maxSize = 0;

    this._blockType = blockType;
  }

  bounds(): Rect {
    return this._bounds;
  }

  borderColor(): Color {
    return this._borderColor;
  }

  setBlockType(blockType: BlockType) {
    if (this._blockType === blockType) {
      return;
    }
    this._blockProgram = null;
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

  initBuffer(numBlocks: number): void {
    if (this._blockBufferNumVertices / 6 === numBlocks) {
      // Same number of blocks, so just reset the counters and overwrite.
      this._blockBufferVertexIndex = 0;
      this._dataBufferVertexIndex = 0;
      return;
    }
    if (this._blockBuffer) {
      this.clear();
    }
    const gl = this.gl();
    this._blockBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._blockBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this._stride * 6 * numBlocks,
      gl.STATIC_DRAW
    );
    this._blockBufferNumVertices = numBlocks * 6;
  }

  clear(): void {
    const gl = this.gl();
    if (this._blockBuffer && !gl.isContextLost()) {
      gl.deleteBuffer(this._blockBuffer);
    }
    this._blockBuffer = null;
    this._bounds.toNaN();
    this._blockBufferNumVertices = null;
    this._dataBufferVertexIndex = 0;
    this._blockBufferVertexIndex = 0;
    this._maxSize = 0;
  }

  writeVertex(): void {
    const pos = (this._dataBufferVertexIndex++ * this._stride) / 4;
    this._dataBuffer.set(this._vertexBuffer, pos);
    if (this._dataBufferVertexIndex >= this._dataBufferNumVertices) {
      this.flush();
    }
  }

  flush(): void {
    if (this._dataBufferVertexIndex === 0) {
      return;
    }
    const gl = this.gl();
    const stride: number = this._stride;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._blockBuffer);

    if (
      this._dataBufferVertexIndex + this._blockBufferVertexIndex >
      this._blockBufferNumVertices
    ) {
      throw new Error(
        "GL buffer of " +
          this._blockBufferNumVertices +
          " vertices is full; cannot flush all " +
          this._dataBufferVertexIndex +
          " vertices because the GL buffer already has " +
          this._blockBufferVertexIndex +
          " vertices."
      );
    }
    if (this._dataBufferVertexIndex >= this._dataBufferNumVertices) {
      // console.log(
      //   "Writing " +
      //   this._dataBufferNumVertices +
      //   " vertices to offset " +
      //   this._blockBufferVertexIndex +
      //   " of " + this._blockBufferNumVertices + " vertices");
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        this._blockBufferVertexIndex * stride,
        this._dataBuffer
      );
    } else {
      // console.log(
      //   "Partial flush (" +
      //   this._blockBufferVertexIndex +
      //   "/" + this._blockBufferNumVertices +
      //   " from " + (this._dataBufferVertexIndex*stride/4) + ")");
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        this._blockBufferVertexIndex * stride,
        this._dataBuffer.slice(0, (this._dataBufferVertexIndex * stride) / 4)
      );
    }
    this._blockBufferVertexIndex += this._dataBufferVertexIndex;
    this._dataBufferVertexIndex = 0;
  }

  drawBlock(
    cx: number,
    cy: number,
    width: number,
    height: number,
    borderRoundedness: number,
    borderThickness: number,
    borderScale: number
  ): void {
    const gl = this.gl();
    if (gl.isContextLost()) {
      return;
    }
    if (!this._blockBuffer) {
      throw new Error(
        "BlockPainter.initBuffer(numBlocks) must be called first."
      );
    }
    if (this._blockBufferVertexIndex >= this._blockBufferNumVertices) {
      throw new Error("BlockPainter is full and cannot draw any more blocks.");
    }
    this._bounds.include(cx, cy, width, height);
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
    if (typeof borderScale !== "number" || isNaN(borderScale)) {
      throw new Error("borderScale must be a number, but was " + borderScale);
    }

    const buf = this._vertexBuffer;

    // Append color data.
    const bg = this.backgroundColor();
    buf[4] = bg.r();
    buf[5] = bg.g();
    buf[6] = bg.b();
    buf[7] = bg.a();

    // Append border color data.
    const borC = this.borderColor();
    buf[8] = borC.r();
    buf[9] = borC.g();
    buf[10] = borC.b();
    buf[11] = borC.a();

    // Append border radius data.
    if (height < width) {
      buf[12] = (borderScale * borderRoundedness) / height;
      buf[13] = (borderScale * borderThickness) / height;
    } else {
      // height > width
      buf[12] = (borderScale * borderRoundedness) / width;
      buf[13] = (borderScale * borderThickness) / width;
    }
    buf[14] = height / width;

    // Append position and texture coordinate data.
    buf[0] = cx - width / 2;
    buf[1] = cy - height / 2;
    buf[2] = 0;
    buf[3] = 0;
    this.writeVertex();

    buf[0] = cx + width / 2;
    buf[1] = cy - height / 2;
    buf[2] = 1;
    buf[3] = 0;
    this.writeVertex();

    buf[0] = cx + width / 2;
    buf[1] = cy + height / 2;
    buf[2] = 1;
    buf[3] = 1;
    this.writeVertex();

    buf[0] = cx - width / 2;
    buf[1] = cy - height / 2;
    buf[2] = 0;
    buf[3] = 0;
    this.writeVertex();

    buf[0] = cx + width / 2;
    buf[1] = cy + height / 2;
    buf[2] = 1;
    buf[3] = 1;
    this.writeVertex();

    buf[0] = cx - width / 2;
    buf[1] = cy + height / 2;
    buf[2] = 0;
    buf[3] = 1;
    this.writeVertex();

    this._maxSize = Math.max(this._maxSize, Math.max(width, height));
  }

  id(): string {
    return "" + this._id;
  }

  toString(): string {
    return "[BlockPainter " + this.id() + "]";
  }

  contextChanged(isLost: boolean) {
    if (isLost) {
      this.clear();
      this._blockProgram = null;
      this._blockProgramSimple = null;
    }
  }

  render(world: Matrix3x3, scale: number, forceSimple?: boolean) {
    this.flush();
    if (this._blockBufferVertexIndex === 0) {
      return;
    }
    const gl = this.gl();
    const usingSimple = forceSimple || this._maxSize * scale < 5;
    // console.log(this._id, this._maxSize * scale, usingSimple);

    if (this._blockProgram === null) {
      const fragProgram = getBlockPainterShader(gl, this._blockType);

      this._blockProgram = compileProgram(
        this.glProvider(),
        "BlockPainter-" + nameBlockType(this._blockType),
        blockPainterVertexShader,
        fragProgram
      );

      // Cache program locations.
      this.uWorld = gl.getUniformLocation(this._blockProgram, "u_world");

      this.aPosition = gl.getAttribLocation(this._blockProgram, "a_position");
      this.aTexCoord = gl.getAttribLocation(this._blockProgram, "a_texCoord");
      this.aColor = gl.getAttribLocation(this._blockProgram, "a_color");
      this.aBorderColor = gl.getAttribLocation(
        this._blockProgram,
        "a_borderColor"
      );
      this.aBorderRoundedness = gl.getAttribLocation(
        this._blockProgram,
        "a_borderRoundedness"
      );
      this.aBorderThickness = gl.getAttribLocation(
        this._blockProgram,
        "a_borderThickness"
      );
      this.aAspectRatio = gl.getAttribLocation(
        this._blockProgram,
        "a_aspectRatio"
      );
    }
    if (this._blockProgramSimple === null) {
      this._blockProgramSimple = compileProgram(
        this.glProvider(),
        "BlockPainterSimple",
        blockPainterVertexShaderSimple,
        blockPainterFragmentShaderSimple
      );
      this.simpleUWorld = gl.getUniformLocation(
        this._blockProgramSimple,
        "u_world"
      );
      this.simpleAPosition = gl.getAttribLocation(
        this._blockProgramSimple,
        "a_position"
      );
      this.simpleAColor = gl.getAttribLocation(
        this._blockProgramSimple,
        "a_color"
      );
    }

    if (usingSimple) {
      gl.useProgram(this._blockProgramSimple);
      gl.uniformMatrix3fv(this.simpleUWorld, false, world);
      gl.enableVertexAttribArray(this.simpleAPosition);
      gl.enableVertexAttribArray(this.simpleAColor);
    } else {
      gl.useProgram(this._blockProgram);
      gl.uniformMatrix3fv(this.uWorld, false, world);
      gl.enableVertexAttribArray(this.aPosition);
      gl.enableVertexAttribArray(this.aTexCoord);
      gl.enableVertexAttribArray(this.aColor);
      gl.enableVertexAttribArray(this.aBorderColor);
      gl.enableVertexAttribArray(this.aBorderRoundedness);
      gl.enableVertexAttribArray(this.aBorderThickness);
      gl.enableVertexAttribArray(this.aAspectRatio);
    }

    const stride = this._stride;
    if (!this._blockBuffer) {
      throw new Error(
        "No block buffer to render;" +
          " BlockPainter.initBuffer(numBlocks) must be called first."
      );
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._blockBuffer);

    // Position: 2 * 4 (two floats)  0-7
    // TexCoord: 2 * 4 (two floats)  8-15
    // Color:    4 * 4 (four floats) 16-31
    // BorColor: 4 * 4 (four floats) 32-47
    // BorRound: 1 * 4 (one float)   48-51
    // BorThick: 1 * 4 (one float)   52-55
    // AspectRa: 1 * 4 (one float)   56-59
    if (usingSimple) {
      gl.vertexAttribPointer(
        this.simpleAPosition,
        2,
        gl.FLOAT,
        false,
        stride,
        0
      );
      gl.vertexAttribPointer(this.simpleAColor, 4, gl.FLOAT, false, stride, 16);
    } else {
      gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, stride, 0);
      gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, stride, 8);
      gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, stride, 16);
      gl.vertexAttribPointer(this.aBorderColor, 4, gl.FLOAT, false, stride, 32);
      gl.vertexAttribPointer(
        this.aBorderRoundedness,
        1,
        gl.FLOAT,
        false,
        stride,
        48
      );
      gl.vertexAttribPointer(
        this.aBorderThickness,
        1,
        gl.FLOAT,
        false,
        stride,
        52
      );
      gl.vertexAttribPointer(this.aAspectRatio, 1, gl.FLOAT, false, stride, 56);
    }

    // console.log(this._blockBufferVertexIndex);
    gl.drawArrays(gl.TRIANGLES, 0, this._blockBufferVertexIndex);

    if (usingSimple) {
      gl.disableVertexAttribArray(this.simpleAPosition);
      gl.disableVertexAttribArray(this.simpleAColor);
    } else {
      gl.disableVertexAttribArray(this.aPosition);
      gl.disableVertexAttribArray(this.aTexCoord);
      gl.disableVertexAttribArray(this.aColor);
      gl.disableVertexAttribArray(this.aBorderColor);
      gl.disableVertexAttribArray(this.aBorderRoundedness);
      gl.disableVertexAttribArray(this.aBorderThickness);
      gl.disableVertexAttribArray(this.aAspectRatio);
    }
  }
}

export { GLProvider, ProxyGLProvider, BasicGLProvider, Color };
