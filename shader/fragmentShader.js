export default `
precision mediump float;

uniform sampler2D albedo;
uniform sampler2D outline;
uniform float time;
varying vec2 vUv;

vec3 rainbow(float value, float width) {
    return vec3(sin(value * width * 3.14),
                sin((value + 1.0 / 3.0) * width * 3.14),
                sin((value + 2.0 / 3.0) * width * 3.14));
}

void main() {
    vec4 albedo = texture2D(albedo, vUv);
    vec4 outline = texture2D(outline, vUv);
    
    float rainbowSpeed = 2.0;
    float rainbowWidth = 20.0;
    float rainbowPosition = fract(vUv.y + vUv.x + time * rainbowSpeed);
    float rainbowValue = smoothstep(0.0, rainbowWidth, rainbowPosition);
    rainbowValue += smoothstep(1.0, 1.0 - rainbowWidth, rainbowPosition);
    
    vec3 rainbowColor = rainbow(rainbowPosition, 2.0);
    float outlineValue = min(0.2, 1.0-outline.a);
    albedo.rgb = mix(albedo.rgb, rainbowColor, outlineValue);

    albedo.rgb = mix(albedo.rgb, vec3(0.976,0.996,1.), outline.a);

    gl_FragColor = albedo;
}
`;
