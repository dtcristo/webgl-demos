const vs = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

// all shaders have a main function
void main() {
  // Scale the positon
  vec2 scaledPosition = a_position * u_scale;

  // Rotate the position
  vec2 rotatedPosition = vec2(
   scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
   scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Add in the translation
  vec2 position = rotatedPosition + u_translation;

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

const fs = `#version 300 es

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

var gl;
var uniforms;

function main() {
  // Get A WebGL context
  gl = document.getElementById("canvas").getContext("webgl2");

  if (!gl) {
    alert("No support for WebGL2");
    return;
  }

  // Inital resize of canvas
  canvasAndViewportResize(gl);

  // Compile the shaders and link into a program
  const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // Look up where the vertex data needs to go
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  uniforms = initUniforms(program, [
    { name: "u_resolution", type: "2f" },
    { name: "u_translation", type: "2f" },
    { name: "u_rotation", type: "2f" },
    { name: "u_scale", type: "2f" },
    { name: "u_color", type: "4f" },
  ]);

  // Create a buffer
  let positionBuffer = gl.createBuffer();

  // Create a vertex array object (attribute state)
  let vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let size = 2;          // 2 components per iteration
  let type = gl.FLOAT;   // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  // Set the clear color to black
  gl.clearColor(0, 0, 0, 1);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want
  gl.bindVertexArray(vao);

  // --------------------------------------------------------------------------

  // Setup buffer data
  let vertexCount = setGeometry(gl);

  // Bounding box, for wall collision
  let width = 100;
  let height = 100;

  // Initial state
  let state = {
    translation: [
      randomInt(gl.canvas.width - width),
      randomInt(gl.canvas.height - height)
    ],
    angle: 20,
    scale: [1, 0.75],
    color: randomColor(),
    xRight: true,
    yDown: true,
  }

  function updateState() {
    // Update angle
    state.angle = state.angle + 2;

    // Update translation and directions
    state.xRight ? state.translation[0]++ : state.translation[0]--;
    state.yDown ? state.translation[1]++ : state.translation[1]--;
    if (state.translation[0] <= 0) {
      if (!state.xRight) { state.color = randomColor(); }
      state.xRight = true;
    }
    if (state.translation[0] + width >= gl.canvas.width) {
      if (state.xRight) { state.color = randomColor(); }
      state.xRight = false;
    }
    if (state.translation[1] <= 0) {
      if (!state.yDown) { state.color = randomColor(); }
      state.yDown = true;
    }
    if (state.translation[1] + height >= gl.canvas.height) {
      if (state.yDown) { state.color = randomColor(); }
      state.yDown = false;
    }
  }

  function render() {
    canvasAndViewportResize(gl);

    // Clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Set uniforms
    setUniform("u_resolution", [gl.canvas.width, gl.canvas.height]);
    setUniform("u_translation", state.translation);
    setUniform("u_rotation", angleToRotation(state.angle));
    setUniform("u_scale", state.scale);
    setUniform("u_color", state.color);

    // Draw current contents of buffers
    draw(vertexCount);

    updateState();

    // Loop on new frame
    requestAnimationFrame(render);
  }

  // Start render loop
  render();
}

function canvasAndViewportResize(gl) {
  // let cssToRealPixels = window.devicePixelRatio || 1;
  let cssToRealPixels = 1;
  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas, cssToRealPixels)) {
    // Update viewport to new canvas size
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return true;
  }
  return false;
}

function initUniforms(program, us) {
  let result = {};
  for(const u of us) {
    result[u.name] = {
      location: gl.getUniformLocation(program, u.name),
      type: u.type
    }
  }
  return result;
}

function setUniform(name, value) {
  const u = uniforms[name];
  switch (u.type) {
    case '2f':
      gl.uniform2fv(u.location, value);
      break;
    case '3f':
      gl.uniform3fv(u.location, value);
      break;
    case '4f':
      gl.uniform4fv(u.location, value);
      break;
  }
}

function draw(count) {
  let primitiveType = gl.TRIANGLES;
  let offset = 0;
  gl.drawArrays(primitiveType, offset, count);
}

function randomColor() {
  return [Math.random(), Math.random(), Math.random(), 1];
}

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
  return Math.floor(Math.random() * range);
}

function angleToRotation(angle) {
  let angleInRadians = angle * Math.PI / 180;
  return [Math.sin(angleInRadians), Math.cos(angleInRadians)];
}

// Fills the buffer with the values that define a rectangle.
function setRectangle(gl, width, height) {
  let x1 = 0;
  let x2 = width;
  let y1 = 0;
  let y2 = height;

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

    return 6;
}

function setGeometry(gl) {
  var width = 100;
  var height = 150;
  var x = -width/2;
  var y = -height/2;
  var thickness = 30;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // left column
      x, y,
      x + thickness, y,
      x, y + height,
      x, y + height,
      x + thickness, y,
      x + thickness, y + height,

      // top rung
      x + thickness, y,
      x + width, y,
      x + thickness, y + thickness,
      x + thickness, y + thickness,
      x + width, y,
      x + width, y + thickness,

      // middle rung
      x + thickness, y + thickness * 2,
      x + width * 2 / 3, y + thickness * 2,
      x + thickness, y + thickness * 3,
      x + thickness, y + thickness * 3,
      x + width * 2 / 3, y + thickness * 2,
      x + width * 2 / 3, y + thickness * 3]),
    gl.STATIC_DRAW);
  return 18;
}
