# WebGL Demos

Adventures and learnings from [WebGL2 Fundamentals](https://webgl2fundamentals.org/).

1.  [Triangle](https://dtcristo.github.io/webgl-demos/triangle/)
2.  [Basic 2D](https://dtcristo.github.io/webgl-demos/basic-2d/)
3.  [Basic 2D Translation](https://dtcristo.github.io/webgl-demos/basic-2d-translation/)
4.  [Basic 2D Rotation](https://dtcristo.github.io/webgl-demos/basic-2d-rotation/)
5.  [Basic 2D Matrices](https://dtcristo.github.io/webgl-demos/basic-2d-matrices/)

## WebGL Introduction

WebGL is a GPU accelerated rasterization API, based on OpenGL. It can be used to generate performant 3D graphics in your web browser.

Note, some info has been taken from [Elm WebGL](https://github.com/elm-community/webgl) docs.

### Rendering Pipeline

![WebGL Pipeline](https://raw.githubusercontent.com/elm-community/webgl/master/pipeline.png)

### Vertex Shader
Takes vertex data and attributes, along with uniforms. Executed once for every vertex. It coverts vertex coordinates to clip space coordinates. Uniforms (constant for all vertexes) are often used for transforming coordinate systems. It also passed varyings (interpolated values) for use in the fragment shader.

#### Inputs
* Vertices
* Attributes
* Uniforms

#### Outputs
* gl_Position (clip space coordinates)
* Varyings

### Rasterizer
Part of the pipeline between vertex shader and fragment shader that converts clip space vertices into a grid of pixels (on the viewport) ready for colouring. This stage is automatic and does not require programming.

### Fragment Shader
Executed for every pixel (or fragment) in the frame. Varyings from the vertex shader as well as uniforms are used to calculate the colour of the pixel. The fragment shader can be used to render textures or generate advanced lighting effects.

#### Inputs
* Varyings
* Uniforms

#### Outputs
* gl_FragColor
