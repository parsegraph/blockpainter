const {webpackConfig, relDir} = require("./webpack.common");

module.exports = {
  entry: {
    index: relDir("src/index.ts"),
    demo: relDir("src/demo.ts"),
    canvas: relDir("src/canvas.ts"),
  },
  ...webpackConfig(false),
};
