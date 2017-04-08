const vs = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

uniform mat3 u_matrix;

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
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
    { name: "u_matrix", type: "m3f" },
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
    scale: [1, 1],
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

    // Calculate matrix
    let projectionMatrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    let translationMatrix = m3.translation(state.translation[0], state.translation[1]);
    let rotationMatrix = m3.rotation(angleToRadians(state.angle));
    let scaleMatrix = m3.scaling(state.scale[0], state.scale[1]);
    let moveOriginMatrix = m3.translation(-50, -75);

    let matrix = m3.multiply(projectionMatrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
    matrix = m3.multiply(matrix, moveOriginMatrix);

    // Set uniforms
    setUniform("u_matrix", matrix)
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
    case 'm3f':
      gl.uniformMatrix3fv(u.location, false, value);
      break;
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

function angleToRadians(angle) {
  return angle * Math.PI / 180;
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
  var x = 0;
  var y = 0;
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

let m3 = {
  projection: function (width, height) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1,
    ];
  },

  translation: function(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },

  rotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },

  scaling: function(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  },

  multiply: function multiply(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
};
