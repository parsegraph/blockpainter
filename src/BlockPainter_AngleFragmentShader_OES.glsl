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

highp float aastep(float threshold, float value)
{
    highp float afwidth = 0.9 * length(vec2(dFdx(value), dFdy(value)));
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
}

void main() {
    highp vec2 st = texCoord;

    // Move origin to (0, 0) with size=2
    st = st * 2.0 - 1.0;

    // Adjust for the aspect ratio.
    st.x = mix(st.x, pow(abs(st.x), 1.0/aspectRatio), step(aspectRatio, 1.0));
    st.y = mix(st.y, pow(abs(st.y), aspectRatio), 1.0 - step(aspectRatio, 1.0));

    // Flatten to positive quadrant.
    st.x = abs(st.x);
    st.y = abs(st.y);

    highp float minRoundness = 0.01;
    highp float roundness = max(minRoundness, borderRoundedness);

    // Calculate the Y position of the border at the given X
    highp float borderAngle = 1.0/roundness;
    highp float borderFunc = -borderAngle*st.x+1.0/roundness;

    // The given position is within the angle if it is under borderFunc.
    highp float inBorder = aastep(0.0, borderFunc - st.y);

    // Determine the content's border by adjusting the borderFunc value.
    highp float contentFunc = -borderAngle*(st.x+borderThickness)+1.0/roundness;

    // The given position is within the angle's content if it is under contentFunc.
    highp float inContent = aastep(0.0, contentFunc - st.y);

    // Calculate whether the given position is under the latitude.
    highp float latitudeFunc = 1.0 - borderThickness;
    highp float inLatitude = step(0.0, latitudeFunc - st.y);

    // Map the two calculated indicators to their colors.
    gl_FragColor = mix(gl_FragColor, borderColor, inBorder);
    gl_FragColor = mix(gl_FragColor, contentColor, inLatitude*inContent);
}

