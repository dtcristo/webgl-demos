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

var gl;

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
  let program = webglUtils.createProgramFromSources(gl, [vs, fs]);

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

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
       0,  0.5]), gl.STATIC_DRAW);

  // --------------------------------------------------------------------------

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

  size = 4;
  type = gl.FLOAT;
  normalize = false;
  stride = 0;
  offset = 0;
  gl.vertexAttribPointer(aColorLocation, size, type, normalize, stride, offset);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    1, 0, 0, 1,
    0, 1, 0, 1,
    0, 0, 1, 1]), gl.STATIC_DRAW);

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
  // let cssToRealPixels = window.devicePixelRatio || 1;
  let cssToRealPixels = 1;
  if (webglUtils.resizeCanvasToDisplaySize(gl.canvas, cssToRealPixels)) {
    // Update viewport to new canvas size
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    return true;
  }
  return false;
}
