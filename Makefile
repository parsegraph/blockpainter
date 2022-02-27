DIST_NAME = blockpainter

SCRIPT_FILES = \
	src/index.ts \
	src/glsl.d.ts \
	src/demo.ts \
	test/test.ts

EXTRA_SCRIPTS = \
	src/BlockPainter_SquareFragmentShader.glsl \
	src/BlockPainter_FragmentShader_Simple.glsl \
	src/BlockPainter_CurlyFragmentShader.glsl \
	src/BlockPainter_AngleFragmentShader.glsl \
	src/BlockPainter_VertexShader.glsl \
	src/BlockPainter_FragmentShader.glsl \
	src/BlockPainter_ParenthesisFragmentShader.glsl \
	src/BlockPainter_VertexShader_Simple.glsl \
	src/BlockPainter_AngleFragmentShader_OES.glsl \
	src/BlockPainter_FragmentShader_OES_standard_derivatives.glsl \
	src/BlockPainter_CurlyFragmentShader_OES.glsl

include ./Makefile.microproject
