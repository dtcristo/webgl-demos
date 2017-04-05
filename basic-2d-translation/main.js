function main() {
  // Get A WebGL context
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl2");

  if (!gl) {
    alert("No support for WebGL2");
    return;
  }

  // Inital resize of canvas
  canvasAndViewportResize(gl);

  var vs = `#version 300 es

  // an attribute is an input (in) to a vertex shader.
  // It will receive data from a buffer
  in vec2 a_position;

  uniform vec2 u_resolution;
  uniform vec2 u_translation;

  // all shaders have a main function
  void main() {
    // Add in the translation
    vec2 position = a_position + u_translation;

    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    // Flip clipSpace vertically
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
  `;

  var fs = `#version 300 es

  // fragment shaders don't have a default precision so we need
  // to pick one. mediump is a good default. It means "medium precision"
  precision mediump float;

  uniform vec4 u_color;

  // we need to declare an output for the fragment shader
  out vec4 outColor;

  void main() {
    // Just set the output to a constant redish-purple
    outColor = u_color;
  }
  `;

  // Compile the shaders and link into a program
  var program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // Look up where the vertex data needs to go
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // Look up uniform locations
  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  var translationUniformLocation = gl.getUniformLocation(program, "u_translation");
  var colorLocation = gl.getUniformLocation(program, "u_color");

  // Create a buffer
  var positionBuffer = gl.createBuffer();

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  // Set the clear color to black
  gl.clearColor(0, 0, 0, 1);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want
  gl.bindVertexArray(vao);

  // Dimentions of rectangle
  var width = 100;
  var height = 100;

  // Setup rectangle data in buffer
  setRectangle(gl, width, height);

  // Initial translation
  var translation = [
    randomInt(gl.canvas.width - width),
    randomInt(gl.canvas.height - height)
  ];

  // Initial colour
  var color = randomColor();

  // Movement directions
  var xRight = true;
  var yDown = true;

  function render() {
    canvasAndViewportResize(gl)

    // Clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set uniforms
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2fv(translationUniformLocation, translation);
    gl.uniform4fv(colorLocation, color);

    // Draw buffers
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);

    // Update translation and directions
    xRight ? translation[0]++ : translation[0]--;
    yDown ? translation[1]++ : translation[1]--;
    if (translation[0] <= 0) {
      if (!xRight) { color = randomColor(); }
      xRight = true;
    }
    if (translation[0] + width >= gl.canvas.width) {
      if (xRight) { color = randomColor(); }
      xRight = false;
    }
    if (translation[1] <= 0) {
      if (!yDown) { color = randomColor(); }
      yDown = true;
    }
    if (translation[1] + height >= gl.canvas.height) {
      if (yDown) { color = randomColor(); }
      yDown = false;
    }

    // Loop on new frame
    requestAnimationFrame(render);
  }

  // Start render loop
  render();
}

function randomColor() {
  return [Math.random(), Math.random(), Math.random(), 1];
}

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
  return Math.floor(Math.random() * range);
}

// Fills the buffer with the values that define a rectangle.
function setRectangle(gl, width, height) {
  var x1 = 0;
  var x2 = width;
  var y1 = 0;
  var y2 = height;

  // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
  // whatever buffer is bound to the `ARRAY_BUFFER` bind point
  // but so far we only have one buffer. If we had more than one
  // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2]), gl.STATIC_DRAW);
}

function canvasAndViewportResize(gl) {
  // var cssToRealPixels = window.devicePixelRatio || 1;
  var cssToRealPixels = 1;
  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas, cssToRealPixels)) {
    // Update viewport to new canvas size
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return true;
  }
  return false;
}
