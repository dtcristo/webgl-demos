const vs = `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_matrix;

out vec2 v_texcoord;

void main() {
  gl_Position = u_matrix * a_position;
  v_texcoord = a_texcoord;
}
`;

const fs = `#version 300 es

precision mediump float;

in vec2 v_texcoord;

uniform sampler2D u_texture;

out vec4 o_color;

void main() {
  o_color = texture(u_texture, v_texcoord);
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
  let program = createProgram(gl,
    loadShader(gl, gl.VERTEX_SHADER, vs),
    loadShader(gl, gl.FRAGMENT_SHADER, fs)
  );

  // --------------------------------------------------------------------------

  uniforms = initUniforms(program, [
    { name: "u_matrix", type: "m4f" }
  ]);

  // -------------------------- POSITION BUFFER --------------------------------

  let aPositionLocation = gl.getAttribLocation(program, "a_position");

  // Create a buffer
  let positionBuffer = gl.createBuffer();

  // Create a vertex array object (attribute state)
  let vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(aPositionLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Set position buffer data
  let vertexCount = setGeometry(gl);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(aPositionLocation, size, type, normalize, stride, offset);

  // ---------------------------- TEXCOORD BUFFER ------------------------------

  var aTexcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // create the texcoord buffer, make it the current ARRAY_BUFFER
  // and copy in the texcoord values
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Copy texture coordinates data to buffer
  setTexcoords(gl);

  // Turn on the attribute
  gl.enableVertexAttribArray(aTexcoordLocation);

  // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floating point values
  var normalize = true;  // convert from 0-255 to 0.0-1.0
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      aTexcoordLocation, size, type, normalize, stride, offset);

  // ---------------------------- TEXTURE DATA --------------------------------

  // Create a texture.
  var texture = gl.createTexture();

  // use texture unit 0
  gl.activeTexture(gl.TEXTURE0 + 0);

  // bind to the TEXTURE_2D bind point of texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  // Asynchronously load an image
  var image = new Image();
  image.src = "../images/hardhat.png";
  image.addEventListener('load', function() {
    // Now that the image has loaded make copy it to the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  });

  // --------------------------------------------------------------------------

  // First let's make some variables
  // to hold the translation,
  var fieldOfViewRadians = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  // Get the starting time.
  var then = 0;

  // --------------------------------------------------------------------------

  // Set the clear color to black
  gl.clearColor(0, 0, 0, 1);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // turn on depth testing
  gl.enable(gl.DEPTH_TEST);

  // tell webgl to cull faces
  gl.enable(gl.CULL_FACE);

  // Bind the attribute/buffer set we want
  gl.bindVertexArray(vao);

  // --------------------------------------------------------------------------
  // ---------------------------- RENDER LOOP ---------------------------------

  function render(time) {
    canvasAndViewportResize(gl);

    // Clear to black and clear depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Convert to seconds
    time *= 0.001;
    var deltaTime = time - then;
    then = time;

    // Animate the rotation
    modelYRotationRadians += -0.7 * deltaTime;
    modelXRotationRadians += -0.4 * deltaTime;

    // Compute the matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    var cameraPosition = [0, 0, 2];
    var up = [0, 1, 0];
    var target = [0, 0, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
    matrix = m4.yRotate(matrix, modelYRotationRadians);

    // Set uniforms
    setUniform("u_matrix", matrix)

    // Draw current contents of buffers
    draw(vertexCount);

    // Loop on new frame
    requestAnimationFrame(render);
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

  // Start render loop
  requestAnimationFrame(render);
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
    case 'm4f':
      gl.uniformMatrix4fv(u.location, false, value);
      break;
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

// Fill the current ARRAY_BUFFER buffer
// with the positions that define a cube.
function setGeometry(gl) {
  var positions = new Float32Array(
    [
    -0.5, -0.5,  -0.5,
    -0.5,  0.5,  -0.5,
     0.5, -0.5,  -0.5,
    -0.5,  0.5,  -0.5,
     0.5,  0.5,  -0.5,
     0.5, -0.5,  -0.5,

    -0.5, -0.5,   0.5,
     0.5, -0.5,   0.5,
    -0.5,  0.5,   0.5,
    -0.5,  0.5,   0.5,
     0.5, -0.5,   0.5,
     0.5,  0.5,   0.5,

    -0.5,   0.5, -0.5,
    -0.5,   0.5,  0.5,
     0.5,   0.5, -0.5,
    -0.5,   0.5,  0.5,
     0.5,   0.5,  0.5,
     0.5,   0.5, -0.5,

    -0.5,  -0.5, -0.5,
     0.5,  -0.5, -0.5,
    -0.5,  -0.5,  0.5,
    -0.5,  -0.5,  0.5,
     0.5,  -0.5, -0.5,
     0.5,  -0.5,  0.5,

    -0.5,  -0.5, -0.5,
    -0.5,  -0.5,  0.5,
    -0.5,   0.5, -0.5,
    -0.5,  -0.5,  0.5,
    -0.5,   0.5,  0.5,
    -0.5,   0.5, -0.5,

     0.5,  -0.5, -0.5,
     0.5,   0.5, -0.5,
     0.5,  -0.5,  0.5,
     0.5,  -0.5,  0.5,
     0.5,   0.5, -0.5,
     0.5,   0.5,  0.5,

    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  return 6 * 6;
}

// Fill the current ARRAY_BUFFER buffer
// with texture coordinates for a cube.
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        [
        // select the bottom left image
        0   , 0  ,
        0   , 0.5,
        0.25, 0  ,
        0   , 0.5,
        0.25, 0.5,
        0.25, 0  ,
        // select the bottom middle image
        0.25, 0  ,
        0.5 , 0  ,
        0.25, 0.5,
        0.25, 0.5,
        0.5 , 0  ,
        0.5 , 0.5,
        // select to bottom right image
        0.5 , 0  ,
        0.5 , 0.5,
        0.75, 0  ,
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 0  ,
        // select the top left image
        0   , 0.5,
        0.25, 0.5,
        0   , 1  ,
        0   , 1  ,
        0.25, 0.5,
        0.25, 1  ,
        // select the top middle image
        0.25, 0.5,
        0.25, 1  ,
        0.5 , 0.5,
        0.25, 1  ,
        0.5 , 1  ,
        0.5 , 0.5,
        // select the top right image
        0.5 , 0.5,
        0.75, 0.5,
        0.5 , 1  ,
        0.5 , 1  ,
        0.75, 0.5,
        0.75, 1  ,

      ]),
      gl.STATIC_DRAW);
}

function degToRad(d) {
  return d * Math.PI / 180;
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
