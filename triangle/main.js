const vs = `#version 300 es

in vec2 a_position;
in vec4 a_color;

out vec4 v_color;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_color = a_color;
}
`;

const fs = `#version 300 es

precision mediump float;

in vec4 v_color;

out vec4 out_color;

void main() {
  out_color = v_color;
}
`;

function main() {
  // Get A WebGL context
  let gl = document.getElementById("canvas").getContext("webgl2");

  if (!gl) {
    alert("No support for WebGL2");
    return;
  }

  // Inital resize of canvas
  canvasAndViewportResize(gl);

  // Compile the shaders and link into a program
  let program = createProgram(gl,
    loadShader(gl, gl.VERTEX_SHADER, vs),
    loadShader(gl, gl.FRAGMENT_SHADER, fs)
  );

  // Create buffers
  let positionBuffer = gl.createBuffer();
  let colorBuffer = gl.createBuffer();

  // Look up where the vertex data needs to go
  let aPositionLocation = gl.getAttribLocation(program, "a_position");
  let aColorLocation = gl.getAttribLocation(program, "a_color");

  // Turn on the attributes
  gl.enableVertexAttribArray(aPositionLocation);
  gl.enableVertexAttribArray(aColorLocation);

  // --------------------------------------------------------------------------

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let size = 2;          // 2 components per iteration
  let type = gl.FLOAT;   // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(aPositionLocation, size, type, normalize, stride, offset);

  let vertices = [
    -0.5, -0.5,
     0.5, -0.5,
     0,    0.5
  ];
  // Copy data into buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // --------------------------------------------------------------------------

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

  size = 4;
  type = gl.FLOAT;
  normalize = false;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(aColorLocation, size, type, normalize, stride, offset);

  let colors = [
    1, 0, 0, 1,
    0, 1, 0, 1,
    0, 0, 1, 1
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // --------------------------------------------------------------------------

  // Set the clear color to black
  gl.clearColor(0, 0, 0, 1);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // --------------------------------------------------------------------------

  function render() {
    canvasAndViewportResize(gl);

    // Clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw current contents of buffers
    let primitiveType = gl.TRIANGLES;
    let offset = 0;
    let vertexCount = 3;
    gl.drawArrays(primitiveType, offset, vertexCount);

    // Loop on new frame
    requestAnimationFrame(render);
  }

  // Start render loop
  render();
}

function canvasAndViewportResize(gl) {
  // let multiplier = window.devicePixelRatio || 1;
  let multiplier = 1;
  var width  = gl.canvas.clientWidth  * multiplier | 0;
  var height = gl.canvas.clientHeight * multiplier | 0;
  if (gl.canvas.width !== width ||  gl.canvas.height !== height) {
    gl.canvas.width  = width;
    gl.canvas.height = height;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return true;
  }
  return false;
}

function loadShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    let lastError = gl.getShaderInfoLog(shader);
    error("*** Error compiling shader '" + shader + "':" + lastError);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
      let lastError = gl.getProgramInfoLog(program);
      error("Error in program linking:" + lastError);
      gl.deleteProgram(program);
      return null;
  }
  return program;
}
