
// import { drawScene } from "./draw_scene.js";
// import { initBuffers } from "./init_buffer.js";
// 
const  SQUARE_COORDS =   [ 0.0, 1.0, 0,
                          2.0, 1.0, 0,
                          2.0, -1.0, 0,
                          0.0, 1.0, 0,
                          2.0, -1.0, 0,
                          0.0, -1.0, 0
                        ];
 const  TRIANGLE_COORDS = [ 0.0, 1.0, 0,
                            1.0, -1.0, 0,
                            -1.0, -1.0, 0
                          ];
//const  TRIANGLE_COORDS = [ -1.0, -2.0, 0.0, 0.0, 1.0, -2.0];

const CUBE_COORDS = [
  // Front face
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

  // Back face
  -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

  // Top face
  -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

  // Bottom face
  -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

  // Right face
  1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

  // Left face
  -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
];



const COLORS_MULCOLTRIANGLE = [
  1.0,
  0.0,
  0.0,
  1.0, // red
  0.0,
  1.0,
  0.0,
  1.0, // green
  0.0,
  0.0,
  1.0,
  1.0, // blue
];
const YELLOW_CUBE = [
  0.327,
  0.327,
  0.0,
  1.0
]
const RED = [
  1.0,
  0.0,
  0.0,
  1.0, // red
]
const SQUARE_COLOR_1 = [
  0.0,
  0.8,
  0.8,
  1.0, 
]

const faceColorsYellow = [
  YELLOW_CUBE, // Front face: white
  YELLOW_CUBE, // Back face: red
  YELLOW_CUBE, // Top face: green
  YELLOW_CUBE, // Bottom face: blue
  YELLOW_CUBE, // Right face: yellow
  YELLOW_CUBE, // Left face: purple
];
const faceColors = [
  [1.0, 1.0, 1.0, 1.0], // Front face: white
  [1.0, 0.0, 0.0, 1.0], // Back face: red
  [0.0, 1.0, 0.0, 1.0], // Top face: green
  [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
  [1.0, 1.0, 0.0, 1.0], // Right face: yellow
  [1.0, 0.0, 1.0, 1.0], // Left face: purple
];

// Convert the array of colors into a table for all the vertices.

var CUBE_COLORS = [];
function initCubeColor(initColors) {
  for (var j = 0; j < initColors.length; ++j) {
    const c = initColors[j];
    // Repeat each color four times for the four vertices of the face
    CUBE_COLORS = CUBE_COLORS.concat(c, c, c, c);
  }
}
initCubeColor(faceColorsYellow)
// for (var j = 0; j < faceColors.length; ++j) {
  // const c = faceColors[j];
  // //////Repeat each color four times for the four vertices of the face
  // CUBE_COLORS = CUBE_COLORS.concat(c, c, c, c);
// }


// ------ Indices ---------------------------------///


  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const INDICES_CUBE = [
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // back
    8, 9, 10, 8, 10, 11, // top
    12, 13, 14, 12, 14, 15, // bottom
    16, 17, 18, 16, 18, 19, // right
    20, 21, 22, 20, 22, 23, // left
  ];

    /// ---------- VERTEX SHADERS ---------- ///
// Vertex shader program
const vsBase = `    
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;
    varying lowp vec4 vPosition;
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vPosition = aVertexPosition;
      vColor = aVertexColor;
    }
  `;
  const vsMulticolor = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor;
  varying lowp vec4 vPosition;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
    vPosition = aVertexPosition;
  }
`;

  /// ---------- FRAGMENT SHADERS ---------- ///
  const fsBase = `
    varying lowp vec4 vColor;

    void main() {
      gl_FragColor = vColor;
    }
  `;
  const fsMulticolor = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;
  const fsLine = `
   
    precision mediump float;
    varying lowp vec4 vPosition;
    
    void main() {
        float k = 10.0;
        int sum = int(vPosition.x * k) ;
        if ((sum - (sum / 2 * 2)) == 0) {
            gl_FragColor = vec4(0, 0.8, 0.8, 1);
        } else {
            gl_FragColor = vec4(1, 1, 1, 1);
        }
    }
`;
/// ----------  Init Buffer ---------- //
/// ---------- Draw Scene ---------- ///

function drawScene(gl, programInfo, buffers, vertex_count, mode) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  //  Матрица проецирования
  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -6.0],
  ); // amount to translate

  if (mode === "3D")
    {
      mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        -0.5, // amount to rotate in radians
        [0, 0, 1],
      ); // axis to rotate around (Z)
      mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        -0.5 , // amount to rotate in radians
        [0, 1, 0],
      ); // axis to rotate around (Y)
      mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        -0.5, // amount to rotate in radians
        [1, 0, 0],
      ); // axis to rotate around (X)
    }

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  setPositionAttribute(gl, buffers, programInfo);
  setColorAttribute(gl, buffers, programInfo);

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix,
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix,
  );
// {
  // const vertexCount = vertex_count//36;
  // const type = gl.UNSIGNED_SHORT;
  // const offset = 0;
  // gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
// }
  {
    const offset = 0;
    const vertexCount = vertex_count;
    const type = gl.UNSIGNED_SHORT;

    switch (mode) {
      case "TRIANGLES": gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
      break;
      case "TRIANGLE_FAN" : gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount);
      break;
      case "TRIANGLE_STRIP": gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
      case "3D": gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
      
      break;
      default: gl.drawArrays(gl.TRIANGLES, offset, vertexCount);

        break;
    }
  }
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl, buffers, programInfo) {
  const numComponents = 3; // pull out 2 values per iteration
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}
// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
function setColorAttribute(gl, buffers, programInfo) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

//
//  ------------------ START HERE MAIN FUNCTIONS -------- BEGIN ---------------------------- //

/// DRAW ///
//
function draw(vs, fs, coords, colors, canvas_name, mode = "TRIANGLES", indices ) {
  const this_canvas = document.querySelector(canvas_name);
  // Initialize the GL context
  const gl = this_canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // +++++++++++++++++++++ SHADERS +++++++++++++++++++++ //
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vs, fs);  
  
  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),

    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };
  // +++++++++++++++++++++   BUFFER +++++++++++++++++++++ //
  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initAllBuffers(gl,coords,colors, indices);
  
  // Draw the scene
  drawScene(gl, programInfo, buffers, coords.length/2, mode);
  
}
////        TRIANGLE END      ////

function polygon_coord(verticesNumber, radius){
  var coordinates = [new Float32Array(3.0 * verticesNumber)];
  var rotationAngle = (2.0 * Math.PI / verticesNumber);
  var startAngle = (- Math.PI / 2.0);
  for (let idx = 0; idx < verticesNumber; idx++) {
      var currentAngle = startAngle + idx * rotationAngle;
      coordinates[idx * 3] = radius * Math.cos(currentAngle);
      coordinates[idx * 3 + 1] = radius * Math.sin(currentAngle);
      coordinates[idx * 3 + 2] = 0;
  }
  return coordinates
}

function main() {
    // Lab 1
    draw(vsBase, fsBase , SQUARE_COORDS, SQUARE_COLOR_1,"#glcanvas1")
    draw(vsMulticolor, fsMulticolor , TRIANGLE_COORDS, COLORS_MULCOLTRIANGLE,"#glcanvas2")
    // Lab 2
    draw(vsBase, fsBase , polygon_coord(5,1), RED,"#glcanvas3", mode = "TRIANGLE_FAN")
    draw(vsBase, fsBase , CUBE_COORDS, CUBE_COLORS, "#glcanvas4", "3D",INDICES_CUBE,)
    draw(vsBase, fsLine , SQUARE_COORDS, SQUARE_COLOR_1,"#glcanvas5")
}



console.log("WebGL before main 1-2")
main();
console.log("WebGL after main 1-2")

