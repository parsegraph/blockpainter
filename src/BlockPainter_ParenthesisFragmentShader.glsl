#ifdef GL_ES
precision mediump float;
#endif

// Derived from https://thebookofshaders.com/07/
varying highp vec4 contentColor;
varying highp vec4 borderColor;
varying highp float borderRoundedness;
varying highp vec2 texCoord;
varying highp float borderThickness;
varying highp float aspectRatio;

highp float calculate(float x, float y) {
    highp float minRoundness = 0.01;
    highp float roundness = max(minRoundness, borderRoundedness);
    return length(vec2(x, y*roundness));
}

void main() {
    highp vec2 st = vec2(texCoord);

    // Move origin to (0, 0) with size=2
    st = st * 2.0 - 1.0;

    // Adjust for the aspect ratio.
    st.x = mix(st.x, pow(abs(st.x), 1.0/aspectRatio), step(aspectRatio, 1.0));
    st.y = mix(st.y, pow(abs(st.y), aspectRatio), 1.0 - step(aspectRatio, 1.0));

    // Flatten to positive quadrant.
    st.x = abs(st.x);
    st.y = abs(st.y);

    highp float borderFunc = calculate(st.x, st.y);

    // The given position is within the angle if it is under borderFunc.
    highp float inBorder = 1.0 - step(1.0, borderFunc);

    // Determine the content's border by adjusting the borderFunc value.
    highp float contentFunc = calculate(st.x+borderThickness, st.y);

    // The given position is within the angle's content if it is under contentFunc.
    highp float inContent = 1.0 - step(1.0, contentFunc);

    // Calculate whether the given position is under the latitude.
    highp float latitudeFunc = 1.0 - borderThickness;
    highp float inLatitude = 0.0;
    if (latitudeFunc > abs(2.0 * texCoord.y - 1.0)) {
        inLatitude = 1.0;
    }

    // Map the two calculated indicators to their colors.
    gl_FragColor = mix(gl_FragColor, borderColor, inBorder);
    gl_FragColor = mix(gl_FragColor, contentColor, inBorder*inLatitude*inContent);
}
