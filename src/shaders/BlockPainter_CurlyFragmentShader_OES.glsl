#extension GL_OES_standard_derivatives : enable

#ifdef GL_ES
precision mediump float;
#endif

// Derived from https://thebookofshaders.com/07/
varying highp vec4 contentColor;
varying highp vec4 borderColor;
varying highp float borderRoundedness;
varying highp vec2 texCoord;
// borderThickness is in [0, 1] terms.
varying highp float borderThickness;
varying highp float aspectRatio;

void main() {
    // Adjust for the aspect ratio.
    highp vec2 st = texCoord;
    st = st * 2.0 - 1.0;

    // Adjust for the aspect ratio.
    st.x = mix(st.x, pow(abs(st.x), 1.0/aspectRatio), step(aspectRatio, 1.0));
    st.y = mix(st.y, pow(abs(st.y), aspectRatio), 1.0 - step(aspectRatio, 1.0));
    st.x = abs(st.x);
    st.y = abs(st.y);

    highp float inBorder = step(st.y, smoothstep(0.0, borderRoundedness, 1.0 - st.x));
    highp float inContent = step(1.0, step(st.y, (1.0-borderThickness)*smoothstep(0.0, borderRoundedness, 1.0 - (st.x + borderThickness))));

    // Map the two calculated indicators to their colors.
    gl_FragColor = vec4(borderColor.rgb, borderColor.a * inBorder);
    gl_FragColor = mix(gl_FragColor, contentColor, inBorder * inContent);
}
