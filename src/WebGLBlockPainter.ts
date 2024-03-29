import { Matrix3x3 } from "parsegraph-matrix";
import { compileProgram, GLProvider } from "parsegraph-compileprogram";

import BlockType, { nameBlockType } from "./BlockType";
import AbstractBlockPainter from "./AbstractBlockPainter";

import blockPainterVertexShader from "./shaders/BlockPainter_VertexShader.glsl";
import blockPainterVertexShaderSimple from "./shaders/BlockPainter_VertexShader_Simple.glsl";

// Same as above, but using a better antialiasing technique.
import blockPainterFragmentShaderOESStandardDerivatives from "./shaders/BlockPainter_FragmentShader_OES_standard_derivatives.glsl";

import blockPainterFragmentShaderSimple from "./shaders/BlockPainter_FragmentShader_Simple.glsl";

import blockPainterRoundedFragmentShader from "./shaders/BlockPainter_FragmentShader.glsl";
import blockPainterSquareFragmentShader from "./shaders/BlockPainter_SquareFragmentShader.glsl";
import blockPainterAngleFragmentShader from "./shaders/BlockPainter_AngleFragmentShader.glsl";
import blockPainterAngleFragmentShaderOES from "./shaders/BlockPainter_AngleFragmentShader_OES.glsl";

import blockPainterParenthesisFragmentShader from "./shaders/BlockPainter_ParenthesisFragmentShader.glsl";
import blockPainterCurlyFragmentShader from "./shaders/BlockPainter_CurlyFragmentShader.glsl";
import blockPainterCurlyFragmentShaderOES from "./shaders/BlockPainter_CurlyFragmentShader_OES.glsl";

function getBlockPainterShader(
  gl: WebGLRenderingContext,
  blockType: BlockType
) {
  const hasOES = gl.getExtension("OES_standard_derivatives") != null;
  let fragProgram: string;
  switch (blockType) {
    case BlockType.ROUNDED:
      fragProgram = blockPainterRoundedFragmentShader;
      if (hasOES) {
        fragProgram = blockPainterFragmentShaderOESStandardDerivatives;
      }
      break;
    case BlockType.SQUARE:
      fragProgram = blockPainterSquareFragmentShader;
      break;
    case BlockType.ANGLE:
      fragProgram = blockPainterAngleFragmentShader;
      if (hasOES) {
        fragProgram = blockPainterAngleFragmentShaderOES;
      }
      break;
    case BlockType.PARENTHESIS:
      fragProgram = blockPainterParenthesisFragmentShader;
      break;
    case BlockType.CURLY:
      if (hasOES) {
        fragProgram = blockPainterCurlyFragmentShaderOES;
      }
      fragProgram = blockPainterCurlyFragmentShader;
      break;
    default:
      throw new Error("Unsupported block type: " + blockType);
  }
  return fragProgram;
}

export default class WebGLBlockPainter extends AbstractBlockPainter {
  _blockBuffer: WebGLBuffer;
  _blockBufferNumVertices: number;
  _blockBufferVertexIndex: number;
  _blockProgram: WebGLProgram;
  _blockProgramSimple: WebGLProgram;
  _stride: number;
  _vertexBuffer: Float32Array;
  _dataBufferVertexIndex: number;
  _dataBufferNumVertices: number;
  _dataBuffer: Float32Array;
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

  _glProvider: GLProvider;

  constructor(
    glProvider: GLProvider,
    blockType: BlockType = BlockType.ROUNDED
  ) {
    super(blockType);
    this._glProvider = glProvider;

    // Prepare buffer using prepare(numBlocks).
    // BlockPainter supports a fixed number of blocks.

    this._blockBuffer = null;
    this._blockBufferNumVertices = null;
    this._blockBufferVertexIndex = 0;

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
  }

  gl() {
    return this.glProvider().gl();
  }

  glProvider() {
    return this._glProvider;
  }

  setBlockType(blockType: BlockType) {
    if (this.blockType() === blockType) {
      return;
    }
    this._blockProgram = null;
    super.setBlockType(blockType);
  }

  initBuffer(numBlocks: number): void {
    super.initBuffer(numBlocks);
    if (this._blockBufferNumVertices / 6 === numBlocks) {
      // Same number of blocks, so just reset the counters and overwrite.
      this._blockBufferVertexIndex = 0;
      this._dataBufferVertexIndex = 0;
      return;
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
    super.clear();
    this._blockBufferNumVertices = null;
    this._dataBufferVertexIndex = 0;
    this._blockBufferVertexIndex = 0;
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
    borderThickness: number
  ): void {
    super.drawBlock(cx, cy, width, height, borderRoundedness, borderThickness);

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
      buf[12] = borderRoundedness / height;
      buf[13] = borderThickness / height;
    } else {
      // height > width
      buf[12] = borderRoundedness / width;
      buf[13] = borderThickness / width;
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
  }

  render(world: Matrix3x3, scale: number) {
    this.flush();
    if (this._blockBufferVertexIndex === 0) {
      return;
    }
    const gl = this.gl();
    const usingSimple = this.usingSimple(scale);
    // console.log(this._maxSize * scale, usingSimple);

    if (usingSimple) {
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
      gl.useProgram(this._blockProgramSimple);
      gl.uniformMatrix3fv(this.simpleUWorld, false, world);
      gl.enableVertexAttribArray(this.simpleAPosition);
      gl.enableVertexAttribArray(this.simpleAColor);
    } else {
      if (this._blockProgram === null) {
        const fragProgram = getBlockPainterShader(gl, this.blockType());

        this._blockProgram = compileProgram(
          this.glProvider(),
          "BlockPainter-" + nameBlockType(this.blockType()),
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
