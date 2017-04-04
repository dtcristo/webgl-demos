function main() {
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl2");

  if (!gl) {
    alert("No support for WebGL2");
    return;
  }

  var vertexShaderSource = `#version 300 es

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

  var fragmentShaderSource = `#version 300 es

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

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  var program = createProgram(gl, vertexShader, fragmentShader);

  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
  var colorLocation = gl.getUniformLocation(program, "u_color");

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // three 2d points
  var positions = [
    10, 20,
    80, 20,
    10, 30,
    10, 30,
    80, 20,
    80, 30,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);

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

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);

  var needToRender = true;  // draw at least once
  function render() {
     if (resize(gl) || needToRender) {
      //  alert('here');
       needToRender = false;
       draw(gl, resolutionUniformLocation, colorLocation);
     }
     requestAnimationFrame(render);
  }
  render();
}

function draw(gl, resolutionUniformLocation, colorLocation) {
  // Pass in the canvas resolution so we can convert from
  // pixels to clipspace in the shader
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  gl.clear(gl.COLOR_BUFFER_BIT);
  // draw 50 random rectangles in random colors
  for (var ii = 0; ii < 50; ++ii) {
    // Setup a random rectangle
    setRectangle(gl,
      randomInt(gl.canvas.width - randomInt(300)),
      randomInt(gl.canvas.height - randomInt(300)),
      randomInt(300), randomInt(300)
    );
    // setRectangle(gl, 10, 10, 100, 100);

    // Set a random color.
    gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

function resize(gl) {
  var canvas = gl.canvas;
  var cssToRealPixels = window.devicePixelRatio || 1;

  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  var displayWidth  = Math.floor(canvas.clientWidth  * cssToRealPixels);
  var displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);

  // Check if the canvas is not the same size.
  if (canvas.width  !== displayWidth ||
      canvas.height !== displayHeight) {

    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;

    gl.viewport(0, 0, displayWidth, displayHeight);
    return true;
  }
  return false;
}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
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
