function loadProgram ( gl, vertId, fragId ) 
{
	var fragmentShader = getShader ( gl, vertId );
	var vertexShader   = getShader ( gl, fragId );
	var shaderProgram  = gl.createProgram ();
	
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		console.log("Could not initialise shaders");
		gl.deleteProgram(shaderProgram);
		return null;
	}
	
	return shaderProgram;
}

function getShader ( gl, id )
{
	var shaderScript = document.getElementById ( id );

	if (!shaderScript)
		return null;

	var str = "";
	var k = shaderScript.firstChild;

	while ( k ) 
	{
		if ( k.nodeType == 3 )
			str += k.textContent;

		k = k.nextSibling;
	}

	var shader;

	if ( shaderScript.type == "x-shader/x-fragment" )
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	else if ( shaderScript.type == "x-shader/x-vertex" )
		shader = gl.createShader(gl.VERTEX_SHADER);
	else
		return null;

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
	{
		console.log(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function setMatrixUniform ( gl, program, name, mat )
{
	var loc  = gl.getUniformLocation ( program, name );
	
	gl.uniformMatrix4fv ( loc,  false, new Float32Array(mat.flatten())); 
}

function createGLTexture(gl, image, texture)
{
	gl.enable(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);    
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.generateMipmap(gl.TEXTURE_2D)
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function loadImageTexture(gl, url)
{
	var texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function() { createGLTexture(gl, texture.image, texture) }
	texture.image.src = url;
	
	return texture;
}
