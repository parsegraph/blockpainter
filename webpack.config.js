const {webpackConfig, relDir} = require("./webpack.common");

module.exports = {
  entry: {
    lib: relDir("src/blockpainter.ts"),
    demo: relDir("src/demo.ts"),
  },
  ...webpackConfig(false),
};
