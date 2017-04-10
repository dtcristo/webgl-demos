# WebGL Demos

Adventures and learnings in WebGL. Thanks goes to [WebGL2 Fundamentals](https://webgl2fundamentals.org/) for the amazing tutorial and example code.

1.  [Triangle](https://dtcristo.github.io/webgl-demos/triangle/)
2.  [Rectangles](https://dtcristo.github.io/webgl-demos/rectangles/)
3.  [Translation](https://dtcristo.github.io/webgl-demos/translation/)
4.  [Rotation](https://dtcristo.github.io/webgl-demos/rotation/)
5.  [Matrices](https://dtcristo.github.io/webgl-demos/matrices/)

## WebGL Introduction

WebGL is a GPU accelerated rasterization API, based on OpenGL. It can be used to generate performant 3D graphics in your web browser.

### Rendering Pipeline
This diagram summarises the WebGL pipeline.

![WebGL Pipeline](https://raw.github.com/dtcristo/webgl-demos/master/images/pipeline.png)

*Image sourced from [Elm WebGL](https://github.com/elm-community/webgl).*

### Clip space
Clip space is the coordinate system used by WebGL.

![Clip space](https://raw.github.com/dtcristo/webgl-demos/master/images/clipspace.png)

*Image sourced from [here](https://scs.senecac.on.ca/~gam666/pages/content/3dmat.html).*

### Vertex Shader
Takes vertex data and attributes, along with uniforms. Executed once for every vertex. It coverts vertex coordinates to clip space coordinates. Uniforms (constant for all vertexes) are often used for transforming coordinate systems. It also passed varyings (interpolated values) for use in the fragment shader.

#### Inputs
* **Vertex** - vertex coordinates.
* **Attributes** - any attributes for vertex.
* **Uniforms** - data used in calculations, constant for all vertices.

#### Outputs
* **gl_Position** - clip space coordinates for vertex.
* **Varyings** - interpolated data used in fragment shader.

### Rasterizer
Part of the pipeline between vertex shader and fragment shader that converts clip space vertices into a grid of pixels (on the viewport) ready for colouring. This stage is automatic and does not require programming.

### Fragment Shader
Executed for every pixel (or fragment) in the frame. Varyings from the vertex shader as well as uniforms are used to calculate the colour of the pixel. The fragment shader can be used to render textures or generate advanced lighting effects.

#### Inputs
* **Varyings** - interpolated from vertex shader.
* **Uniforms** - data used in calculations, constant for all pixels.

#### Outputs
* **gl_FragColor** - output colour of pixel.
