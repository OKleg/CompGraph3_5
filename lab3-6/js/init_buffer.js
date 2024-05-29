/// ----------  Init Buffer ---------- ///

function initPositionBuffer(gl, coords) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();
    
    // Select the positionBuffer as the one to apply buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Now create an array of positions for the square.
    const positions = coords;
    
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    return positionBuffer;
    }
    
function initColorBuffer(gl, colors) {
    
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    return colorBuffer;
}

function initIndexBuffer(gl,indices) {
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

// Now send the element array to GL

gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
);

return indexBuffer;
}

function initAllBuffers(gl, coords , colors, indices) {
const positionBuffer = initPositionBuffer(gl, coords);

if (colors.length == 4){
    for (let i = 0; i < coords.length/2; i++) {
    colors = colors.concat(colors);
    }
    
}
const colorBuffer = initColorBuffer(gl, colors);

const indexBuffer = initIndexBuffer(gl, indices);

return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
};
}

/// ---------- Draw Scene ---------- ///
