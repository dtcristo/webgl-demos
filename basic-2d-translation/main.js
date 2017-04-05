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

  // all shaders have a main function
  void main() {
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;

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

  // Clear the canvas to black
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want
  gl.bindVertexArray(vao);

  // Dimentions of rectangle
  var width = 100;
  var height = 100;

  // Initial colour
  var color = randomColor();

  // Initial position
  var pos = [
    randomInt(gl.canvas.width - width),
    randomInt(gl.canvas.height - height)
  ];
  var xRight = true;
  var yDown = true;

  function render() {
    canvasAndViewportResize(gl)

    // Clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set canvas size uniform
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    // Set colour uniform
    gl.uniform4fv(colorLocation, color);

    // Setup rectangle data in buffer
    setRectangle(gl, pos[0], pos[1], 100, 100);

    // Draw buffers
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);

    xRight ? pos[0]++ : pos[0]--;
    yDown ? pos[1]++ : pos[1]--;

    if (pos[0] <= 0) {
      if (!xRight) { color = randomColor(); }
      xRight = true;
    }
    if (pos[0] + width >= gl.canvas.width) {
      if (xRight) { color = randomColor(); }
      xRight = false;
    }
    if (pos[1] <= 0) {
      if (!yDown) { color = randomColor(); }
      yDown = true;
    }
    if (pos[1] + height >= gl.canvas.height) {
      if (yDown) { color = randomColor(); }
      yDown = false;
    }

    requestAnimationFrame(render);
  }
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
function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

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
  var cssToRealPixels = window.devicePixelRatio || 1;
  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas, cssToRealPixels)) {
    // Update viewport to new canvas size
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return true;
  }
  return false;
}
