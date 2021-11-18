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

void main() {
    highp vec2 st = texCoord;
    st = st * 2.0 - 1.0;

    // Adjust for the aspect ratio.
    st.x = mix(st.x, pow(abs(st.x), 1.0/aspectRatio), step(aspectRatio, 1.0));
    st.y = mix(st.y, pow(abs(st.y), aspectRatio), 1.0 - step(aspectRatio, 1.0));

    st.x = abs(st.x);
    st.y = abs(st.y);
    highp float cornerFunc = -st.x+(1.0 - borderRoundedness*borderThickness)*2.0;
    highp float inCorner = step(0.0, cornerFunc - st.y);

    if(st.y < 1.0 - borderThickness && st.x < 1.0 - borderThickness) {
        gl_FragColor = contentColor;
    } else {
        gl_FragColor = borderColor;
    }
    gl_FragColor = mix(vec4(0.0, 0.0, 0.0, 0.0), gl_FragColor, step(1.0, inCorner));
}
