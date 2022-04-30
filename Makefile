DIST_NAME = blockpainter

SCRIPT_FILES = \
	src/index.ts \
	src/BlockPainter.ts \
	src/WebGLBlockPainter.ts \
	src/glsl.d.ts \
	src/CanvasBlockPainter.ts \
	src/AbstractBlockPainter.ts \
	src/demo.ts \
	test/test.ts

EXTRA_SCRIPTS = \
	src/shaders/BlockPainter_SquareFragmentShader.glsl \
	src/shaders/BlockPainter_FragmentShader_Simple.glsl \
	src/shaders/BlockPainter_CurlyFragmentShader.glsl \
	src/shaders/BlockPainter_AngleFragmentShader.glsl \
	src/shaders/BlockPainter_VertexShader.glsl \
	src/shaders/BlockPainter_FragmentShader.glsl \
	src/shaders/BlockPainter_ParenthesisFragmentShader.glsl \
	src/shaders/BlockPainter_VertexShader_Simple.glsl \
	src/shaders/BlockPainter_AngleFragmentShader_OES.glsl \
	src/shaders/BlockPainter_FragmentShader_OES_standard_derivatives.glsl \
	src/shaders/BlockPainter_CurlyFragmentShader_OES.glsl

include ./Makefile.microproject
