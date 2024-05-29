import { getCubeElements } from '../model/cube.js';
import { getSphereElements } from '../model/sphere.js';

const vsGuro = `#version 300 es
	in vec3 aVertexPosition;
	in vec3 aVertexNormal;
	in vec4 aVertexColor;
	in vec2 aTextureCoord;

	uniform mat4 mvMatrix;
	uniform mat4 prMatrix;
	uniform mat3 nMatrix;

	uniform vec3 uLightColor;
	uniform vec3 uLightPosition;
	//Для источника света
	uniform vec3 uAmbientLightColor;
	uniform vec3 uDiffuseLightColor;
	uniform vec3 uSpecularLightColor;

	uniform float uShininess;
	uniform float roughness;
	uniform float intensity;
	uniform float F0;

	uniform float lin_attenuation;
	uniform float quad_attenuation;

	uniform int uLightFlag;
	uniform int uShadingFlag;

	out vec3 vLightWeighting;
	out lowp vec4 vColor;
	out highp vec2 vTextureCoord;
	out highp float vAttenuation;
	
	vec3 LambertLight(vec3 lightDirection, vec3 normal) {
		float diffuseLightDot = max(dot(normal, lightDirection), 0.0);
		return(uAmbientLightColor + uDiffuseLightColor * diffuseLightDot);
	}

	vec3 FongLight(vec3 lightDirection, vec3 normal, vec3 vertexPositionEye3) {
		float diffuseLightDot = max(dot(normal, lightDirection), 0.0);

		// Normalize view vector
		vec3 viewVectorEye = normalize(-vertexPositionEye3);

		// получаем вектор отраженного луча
		vec3 reflectionVector = reflect(-lightDirection, normal);

		// Вычисляем specular
		float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
		float specularLightParam = pow(specularLightDot, uShininess);

		// (ambient + diffuse + specular)
		return(uAmbientLightColor + uDiffuseLightColor * diffuseLightDot + uSpecularLightColor * specularLightParam);
	}

	void main(void) {
	// Установка позиции наблюдателя сцены
	vec4 vertexPositionEye4 = mvMatrix * vec4(aVertexPosition, 1.0);
	vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

	// Вычисление вектора направления света
	vec3 lightDirection = normalize(uLightPosition - vertexPositionEye3);

	// Вычисление нормали
	vec3 normal = normalize(nMatrix * aVertexNormal);

	vLightWeighting = vec3(1.0,1.0,1.0);

	float distance = length(uLightPosition - aVertexPosition);
	float aAttenuation = 1.0 / (1.0 + lin_attenuation * distance + quad_attenuation * distance * distance);

	if (uShadingFlag == 1) {
		//Ламберт
		if (uLightFlag == 1) { vLightWeighting = LambertLight(lightDirection, normal); };

		//Фонг
		if (uLightFlag == 2) { vLightWeighting = FongLight(lightDirection, normal, vertexPositionEye3); };

	}

	// Трансформируем
	gl_Position = prMatrix * mvMatrix * vec4(aVertexPosition, 1.0);

	// Передаем в фрагментный
	vColor = aVertexColor;
	vTextureCoord = aTextureCoord;
	vAttenuation = aAttenuation;

	}

`;
const fsGuro = `#version 300 es
	precision mediump float;
	in vec3 vLightWeighting;
	in vec2 vTextureCoord;
	in lowp vec4 vColor;
	in highp float vAttenuation;
	uniform sampler2D u1Sampler;
	uniform sampler2D u2Sampler;
	uniform sampler2D u3Sampler;
	uniform int uTextureFlag;
	uniform float texture_contrib;
	out vec4 fragColor;
	void main(void) {

		vec4 tex1Color = texture(u1Sampler, vTextureCoord);
		vec4 tex2Color = texture(u2Sampler, vTextureCoord);
		vec4 tex3Color = texture(u3Sampler, vTextureCoord);
		fragColor = vec4(vLightWeighting.rgb * vColor.rgb, vColor.a);
		switch (uTextureFlag) {
		case 1:
		    //С цветом
			fragColor = vec4(vLightWeighting.rgb * vColor.rgb * vAttenuation, vColor.a);	    
			break;
		case 2:
		    //С первой текстурой
			fragColor = vec4(vLightWeighting.rgb * tex1Color.rgb * vAttenuation, tex1Color.a * vColor.a);
		    break;
		case 3:
		    //Со второй текстурой
			fragColor = vec4(vLightWeighting.rgb * tex2Color.rgb * vAttenuation, tex2Color.a * vColor.a);
		    break;
		case 4:
		    //С первой и второй текстурой
			fragColor = vec4(vLightWeighting.rgb * mix(tex1Color.rgb,tex2Color.rgb,texture_contrib).rgb * vAttenuation, tex1Color.a * tex2Color.a);
		    break;
		case 5:
			//С цветом, первой и второй текстурой
		    fragColor = vec4(vLightWeighting.rgb * mix(tex1Color.rgb,tex2Color.rgb,texture_contrib).rgb * vColor.rgb * vAttenuation, tex1Color.a * tex2Color.a * vColor.a);
		    break;
		case 6:
			// BUMP 
		    fragColor = vec4(vLightWeighting.rgb * tex3Color.rgb * vAttenuation, tex3Color.a * vColor.a);
		    break;
		}
	}
`;

const vsFong = `#version 300 es

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec4 aVertexColor;
in vec2 aTextureCoord;

uniform float lin_attenuation;
uniform float quad_attenuation;

uniform mat4 mvMatrix;
uniform mat4 prMatrix;
uniform mat3 nMatrix;

uniform vec3 uLightPosition;

out lowp vec4 vColor;
out highp vec2 vTextureCoord;
out highp vec3 vPositionEye3;
out highp vec3 vNormal;
out highp vec3 vLightDirection;
out highp float vAttenuation;

void main(void) {
// Установка позиции наблюдателя сцены
vec4 vertexPositionEye4 = mvMatrix * vec4(aVertexPosition, 1.0);
vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

// Вычисление вектора направления света
vec3 lightDirection = normalize(uLightPosition - vertexPositionEye3);

// Вычисление нормали
vec3 normal = normalize(nMatrix * aVertexNormal);

// Трансформируем
gl_Position = prMatrix * mvMatrix * vec4(aVertexPosition, 1.0);

float distance = length(uLightPosition - aVertexPosition);
float aAttenuation = 1.0 / (1.0 + lin_attenuation * distance + quad_attenuation * distance * distance);

// Передаем в фрагментный
vColor = aVertexColor;
vTextureCoord = aTextureCoord;
vLightDirection = lightDirection;
vPositionEye3 = vertexPositionEye3;
vAttenuation = aAttenuation;
vNormal = normal;
}`;

const fsFong = `#version 300 es

precision mediump float;

in vec3 vLightWeighting;
in vec2 vTextureCoord;
in lowp vec4 vColor;
in vec3 vPositionEye3;
in highp vec3 vNormal;
in highp vec3 vLightDirection;
in highp float vAttenuation;

uniform vec3 uLightColor;
//Для источника света
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;

uniform float uShininess;

uniform float texture_contrib;

uniform sampler2D u1Sampler;
uniform sampler2D u2Sampler;
uniform sampler2D u3Sampler;

uniform int uTextureFlag;
uniform int uShadingFlag;
uniform int uLightFlag;

out vec4 fragColor;

float BUMPmapping(vec2 vTextureCoord) {
	vec2 dx = dFdx(vTextureCoord);
	vec2 dy = dFdy(vTextureCoord);

	float height = texture(u3Sampler, vTextureCoord).r;

	float xHeightDelta = texture(u3Sampler, vTextureCoord + dx).r - height;
	float yHeightDelta = texture(u3Sampler, vTextureCoord + dy).r - height;
	return vTextureCoord.x * xHeightDelta + vTextureCoord.y * yHeightDelta;
}

vec3 LambertLight(vec3 lightDirection, vec3 normal) {
	float diffuseLightDot = max(dot(normal, lightDirection), 0.0);
	return(uAmbientLightColor + uDiffuseLightColor * diffuseLightDot);
}

vec3 FongLight(vec3 lightDirection, vec3 normal, vec3 vertexPositionEye3) {
	float diffuseLightDot = max(dot(normal, lightDirection), 0.0);

	// Normalize view vector
	vec3 viewVectorEye = normalize(-vertexPositionEye3);

	// получаем вектор отраженного луча
	vec3 reflectionVector = normalize(reflect(-lightDirection, normal));

	// Вычисляем specular
	float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
	float specularLightParam = pow(specularLightDot, uShininess);

	// (ambient + diffuse + specular)
	return(uAmbientLightColor + uDiffuseLightColor * diffuseLightDot + uSpecularLightColor * specularLightParam);
}

void main(void) {

vec3 vLightWeighting = vec3(1.0,1.0,1.0);

vec4 tex1Color = texture(u1Sampler, vTextureCoord);
vec4 tex2Color = texture(u2Sampler, vTextureCoord);
vec4 tex3Color = texture(u3Sampler, vTextureCoord);

vec3 newNormal = normalize(vNormal) - BUMPmapping(vTextureCoord) * 0.75;

if (uShadingFlag == 2) {
	//Ламберт
	if (uLightFlag == 1) { 
		vLightWeighting = LambertLight(vLightDirection, newNormal); 
	};
	//Фонг
	if (uLightFlag == 2) {
		 vLightWeighting = FongLight(vLightDirection, newNormal, vPositionEye3); 
	};
}

fragColor = vec4(vLightWeighting.rgb * vColor.rgb, vColor.a);

switch (uTextureFlag) {
case 1:
	//С цветом
	fragColor = vec4(vLightWeighting.rgb * vColor.rgb * vAttenuation, vColor.a);	    
	break;
case 2:
	//С первой текстурой
	fragColor = vec4(vLightWeighting.rgb * tex1Color.rgb * vAttenuation, tex1Color.a * vColor.a);
	break;
case 3:
	//Со второй текстурой
	fragColor = vec4(vLightWeighting.rgb * tex2Color.rgb * vAttenuation, tex2Color.a * vColor.a);
	break;
case 4:
	//С первой и второй текстурой
	fragColor = vec4(vLightWeighting.rgb * mix(tex1Color.rgb,tex2Color.rgb,texture_contrib).rgb * vAttenuation, tex1Color.a * tex2Color.a);
	break;
case 5:
	//С цветом, первой и второй текстурой
	fragColor = vec4(vLightWeighting.rgb * mix(tex1Color.rgb,tex2Color.rgb,texture_contrib).rgb * vColor.rgb * vAttenuation, tex1Color.a * tex2Color.a * vColor.a);
	break;
case 6:
	// BUMP (след лаба)
	fragColor = vec4(vLightWeighting.rgb * tex3Color.rgb * vAttenuation, tex3Color.a * vColor.a);
	break;
}

} `;
var gl;

var shaderProgram;

var parameters = {
	rotation: { x: 0, y: 0, z: 0, speed: 0 },
	offset: { x: 0, y: 0, z: -5 },
	lightOffset: { x: 0, y: 0, z: 0 },
	lightParams: { 
		ambient: [51,51,51], diffuse: [178,178,178], specular: [255,255,255], light: [255,255,255],
		lin_attenuation: 0.0, quad_attenuation: 0.0, 
		shininess: 16, fresnel: 0.5, intensity: 0.8, roughness: 0.5   
	},
	textureParams: {
		texture_contrib: 0.5
	},
	shadingId: 1,
	lightingId: 1,
	rotationId: 1,
	textureId: 1,
};


var models = {};
var textures = {};
var images = {};

var texture;

var vertexPositionAttribute;
var vertexColorAttribute;
var vertexNormalAttribute;
var textureCoordAttribute;

var mvMatrix;
var prMatrix;
var nMatrix;

var positionBuffer;
var colorBuffer;
var indexBuffer;
var normalBuffer;
var texBuffer;

webGLStart();


const xSliderOffset = document.getElementById("xOffset");
xSliderOffset.addEventListener("input",updateParameters)
const ySliderOffset = document.getElementById("yOffset");
ySliderOffset.addEventListener("input",updateParameters)
const zSliderOffset = document.getElementById("zOffset");
zSliderOffset.addEventListener("input",updateParameters)

const xSliderRotation = document.getElementById("xRotate");
xSliderRotation.addEventListener("input",updateParameters)
const ySliderRotation = document.getElementById("yRotate");
ySliderRotation.addEventListener("input",updateParameters)
const zSliderRotation = document.getElementById("zRotate");
zSliderRotation.addEventListener("input",updateParameters)

const shadingSelect = document.getElementById("shadingId")
shadingSelect.addEventListener("input",updateShading)
const lightingSelect = document.getElementById("lightingId")
lightingSelect.addEventListener("input",updateShading)
const rotationSelect = document.getElementById("rotationId")
rotationSelect.addEventListener("input",updateShading)
const textureSelect = document.getElementById("textureId")
textureSelect.addEventListener("input",updateShading)

const amb = document.getElementById("ambient")
amb.addEventListener("input",updateParameters)
const dif = document.getElementById("diffuse")
dif.addEventListener("input",updateParameters)
const spec = document.getElementById("specular")
spec.addEventListener("input",updateParameters)
const lightCol = document.getElementById("light")
lightCol.addEventListener("input",updateParameters)

const sliderLineAttenuation = document.getElementById("lin_attenuation");
sliderLineAttenuation.addEventListener("input",updateParameters)
const sliderQuadAttenuation = document.getElementById("quad_attenuation");
sliderQuadAttenuation.addEventListener("input",updateParameters)

function updateParameters() {
	//console.log(parameters);
	parameters.offset.x=xSliderOffset.valueAsNumber;
	parameters.offset.y=ySliderOffset.valueAsNumber;
	parameters.offset.z= zSliderOffset.valueAsNumber;
	
	parameters.rotation.x=xSliderRotation.valueAsNumber*Math.PI/2;
	parameters.rotation.y=ySliderRotation.valueAsNumber*Math.PI/2;
	parameters.rotation.z=zSliderRotation.valueAsNumber*Math.PI/2;

	parameters.lightParams.lin_attenuation=sliderLineAttenuation.valueAsNumber;
	parameters.lightParams.quad_attenuation= sliderQuadAttenuation.valueAsNumber;
	// parameters.lightParams.ambient=[amb.value.R,amb.value.g,amb.value.B];
	// parameters.lightParams.diffuse=[dif.value.R,dif.value.g,dif.value.B];
	// parameters.lightParams.specular=[spec.value.R,spec.value.g,spec.value.B];
	// parameters.lightParams.light=[lightCol.value.R,lightCol.value.g,lightCol.value.B];


	drawScene()
}
function updateShading(){
	parameters.shadingId =shadingSelect.value;
	parameters.lightingId = lightingSelect.value;
	parameters.rotationId = rotationSelect.value;
	parameters.textureId = textureSelect.value;
	console.log("updateShading: ",parameters)
	baseInit()
}


function baseInit(callback) {

	switch(parameters.shadingId){
		case 1: shaderProgram = initShaderProgram(gl, vsFong , fsFong); break;
		case 2: shaderProgram = initShaderProgram(gl, vsGuro , fsGuro); break;
		default:shaderProgram = initShaderProgram(gl, vsGuro , fsGuro);
	}
	gl.useProgram(shaderProgram);
	console.log("useProgram")
	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(vertexPositionAttribute);

	vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(vertexColorAttribute);  

	vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(vertexNormalAttribute); 

	textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(textureCoordAttribute);

	// initShaders(parameters.shadingIndex);

	loadTextures([
		"ground_texture.png",
		"wood_texture.png",
		"one_texture.png",
		"two_texture.png",
		"three_texture.png",
		"stone.png",
		"cobblestone.png",
		"glowstone.png",
		"bumpMap.jpg",
		"orange.jpg",
		"orange_ao.jpg",
		], function() {
			models['sphere'] = getSphereElements(1,30,30);
			drawScene();	
		});
		console.log("Texture loaded")

}

//setup GLSL
function webGLStart() {
	var canvas = document.getElementById("glcanvas31");
	console.log("webGLStart: " +canvas.id)
	if ( !canvas )
		alert("Could not initialize canvas");

	try {

		gl = canvas.getContext("webgl2");
		if ( !gl )
			gl = canvas.getContext("experimental-webgl");

	} catch(e) {
		console.log("webGLStart: gl is not def" )
	}

	if ( !gl )
		alert("Could not initialize WebGL");

	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

	//Инициализируем шейдеры

	baseInit(function() { });
	
}

async function loadJSON(path) {
	try {
	    const response = await fetch(path);
	    if (!response.ok) throw new Error('Сетевой ответ некорректен');
	    return await response.json(); 
	} catch (error) {
	    console.error('Ошибка при загрузке:', error);  
	}
}

function drawFigure(model, position, rotation, color, texSrc, tex2Src, tex3Src, size, raxis, isBlended=false) {

	gl.enable(gl.BLEND);

	if (isBlended) { gl.blendFunc(gl.SRC_ALPHA, gl.ONE); } 
	else { gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);}

	//Установка и формирование матриц
	var positions = model.positions.map(el => el * size);
	var colors = [];
	var normals = model.normals;
	var indices = model.indices;
	var textureCoordinates = model.texturecoords;
	var dim = 3;

	for (var i = 0; i < positions.length; i++) {
		colors.push(color);
	}
	
	loadIdentity();
	initBuffers(positions, colors, normals, indices, textureCoordinates, dim)

	var rotationAxis = [];

	if (raxis.length != 0) {
		rotationAxis = [-position[0]+raxis[0], -position[1]+raxis[1], -position[2]+raxis[2]];
	}
	else {
		rotationAxis = [0,0,0];
	}

	mvTranslate( [position[0], position[1], position[2]] )
	mvTranslate( rotationAxis );
	mvRotate(rotation[0], [1,0,0]);
	mvRotate(rotation[1], [0,1,0]);
	mvRotate(rotation[2], [0,0,1]);
	mvTranslate( rotationAxis.map(el => -1 * el ) ); 

	var Pmatrix = gl.getUniformLocation(shaderProgram, "prMatrix");
	var Vmatrix = gl.getUniformLocation(shaderProgram, "mvMatrix");
	var Nmatrix = gl.getUniformLocation(shaderProgram, "nMatrix");

	var subMatrix = Matrix.create([
		[mvMatrix.elements[0][0], mvMatrix.elements[0][1], mvMatrix.elements[0][2]],
		[mvMatrix.elements[1][0], mvMatrix.elements[1][1], mvMatrix.elements[1][2]],
		[mvMatrix.elements[2][0], mvMatrix.elements[2][1], mvMatrix.elements[2][2]]
	]); 
	nMatrix = subMatrix.inverse().transpose();

	handleTextureLoaded(images[texSrc], texSrc);
	handleTextureLoaded(images[tex2Src], tex2Src);
	handleTextureLoaded(images[tex3Src], tex3Src);	
	
	gl.activeTexture(gl.TEXTURE0 + 0);
	gl.bindTexture(gl.TEXTURE_2D, textures[texSrc]);

	gl.activeTexture(gl.TEXTURE0 + 1);
	gl.bindTexture(gl.TEXTURE_2D, textures[tex2Src]);

	gl.activeTexture(gl.TEXTURE0 + 2);
	gl.bindTexture(gl.TEXTURE_2D, textures[tex3Src]);

	gl.uniformMatrix4fv(Pmatrix, false, new Float32Array(prMatrix.flatten()));
	gl.uniformMatrix4fv(Vmatrix, false, new Float32Array(mvMatrix.flatten()));
	gl.uniformMatrix3fv(Nmatrix, false, new Float32Array(nMatrix.flatten()));

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(vertexNormalAttribute, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
	gl.vertexAttribPointer(textureCoordAttribute, texBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	
	gl.drawElements(gl.TRIANGLES, indexBuffer.numItems*indexBuffer.itemSize, gl.UNSIGNED_SHORT, 0);

}

	function loadTextures(srcs, callback){
		
		var imagesToLoad = srcs.length;
		var image = new Image();

		var onImageLoad = function() {
			--imagesToLoad;
			if (imagesToLoad == 0) {
				callback(images);
			}
		};

		for (var ii = 0; ii < imagesToLoad; ++ii) {
			var image = loadImage('js/res/textures/' + srcs[ii], onImageLoad);
			images[srcs[ii]] = image;
			
		}

		var sampler1 = gl.getUniformLocation(shaderProgram, "u1Sampler");
		var sampler2 = gl.getUniformLocation(shaderProgram, "u2Sampler");
		var sampler3 = gl.getUniformLocation(shaderProgram, "u3Sampler");

		gl.uniform1i(sampler1, 0);
		gl.uniform1i(sampler2, 1);
		gl.uniform1i(sampler3, 2);

	}

	function loadImage(src, callback) {
		var image = new Image();
		image.src = src;
		image.onload = callback;
		return image;
	}

	//Загрузка текстуры
	function handleTextureLoaded(image, imageSrc) {

		texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		textures[imageSrc] = texture;
	}

	//Инициализация шейдеров и аттрибутов
	function initShaders(shaderIndex) 
	{

		shaderProgram = loadProgram ( gl, "shader-vs-"+shaderIndex, "shader-fs-"+shaderIndex );
		gl.useProgram(shaderProgram);

		vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(vertexPositionAttribute);

		vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		gl.enableVertexAttribArray(vertexColorAttribute);  

		vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
		gl.enableVertexAttribArray(vertexNormalAttribute); 

		textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
		gl.enableVertexAttribArray(textureCoordAttribute); 

	}

	//Инициализаця буфферов
	function initBuffers(pos, col, nor, ind, tex, dim) 
	{
		const positions = pos.flat();
		const colors = col.flat();
		const normals = nor.flat();
		const indices = ind.flat();
		const texs = tex.flat();

		// Create and store data into vertex buffer
		positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	    // Create and store data into color buffer
	    colorBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	    // Create and store data into normal buffer
	    normalBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	    // Create and store data into texture buffer
	    texBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texs), gl.STATIC_DRAW);

	    // Create and store data into index buffer
	    indexBuffer = gl.createBuffer();
	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	    positionBuffer.itemSize = dim;
	    positionBuffer.numItems = pos.length / dim;

	    colorBuffer.itemSize = 4;
	    colorBuffer.numItems = col.length / 4;	

	    indexBuffer.itemSize = 3;
	    indexBuffer.numItems = ind.length / 3;	

	    normalBuffer.itemSize = 3;
	    normalBuffer.numItems = nor.length / 3;	

	    texBuffer.itemSize = 2;
	    texBuffer.numItems = tex.length / 2;		

	}

	//Вспомогательные операции

	function loadIdentity() 
	{
		mvMatrix = Matrix.I(4);
		nMatrix = Matrix.I(3);
	}

	function multMatrix(m) 
	{
		mvMatrix = mvMatrix.x(m);
	}

	function mvTranslate(v) 
	{
		var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
		multMatrix(m);
	}

	function mvRotate(angle, axis) {
		var radians = angle * Math.PI / 180.0;
		var sinA = Math.sin(radians);
		var cosA = Math.cos(radians);
		var length = Math.sqrt(axis[0]*axis[0] + axis[1]*axis[1] + axis[2]*axis[2]);
		var x = axis[0] / length;
		var y = axis[1] / length;
		var z = axis[2] / length;
		var t = 1.0 - cosA;

		var rotationMatrix = Matrix.create(
			[
			[t*x*x + cosA,     t*x*y - sinA*z,   t*x*z + sinA*y, 0],
			[t*x*y + sinA*z,   t*y*y + cosA,     t*y*z - sinA*x, 0],
			[t*x*z - sinA*y,   t*y*z + sinA*x,   t*z*z + cosA,   0],
			[0,                0,                0,               1]
			]
			);

		multMatrix(rotationMatrix);
	}

	function setupLights(lightOffset ,ambientColor, diffuseColor, specularColor, lightColor) {

		var uniformLightPosition = gl.getUniformLocation(shaderProgram, "uLightPosition");
		var uniformAmbientLightColor = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
		var uniformDiffuseLightColor = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
		var uniformSpecularLightColor = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
		var uniformLightColor = gl.getUniformLocation(shaderProgram, "uLightColor");

		//позиция источника света
		gl.uniform3fv(uniformLightPosition, [lightOffset.x, lightOffset.y, lightOffset.z]);

		//соствавляющие цвета
		gl.uniform3fv(uniformAmbientLightColor, [ambientColor[0] / 255, ambientColor[1] / 255, ambientColor[2] / 255]);
		gl.uniform3fv(uniformDiffuseLightColor, [diffuseColor[0] / 255, diffuseColor[1] / 255, diffuseColor[2] / 255]);
		gl.uniform3fv(uniformSpecularLightColor, [specularColor[0] / 255, specularColor[1] / 255, specularColor[2] / 255]);
		gl.uniform3fv(uniformLightColor, [lightColor[0] / 255, lightColor[1] / 255, lightColor[2] / 255]);

	}

	function perspective(fovy, aspect, znear, zfar) 
	{
		prMatrix = makePerspective(fovy, aspect, znear, zfar);
	}

	//Отрисовка сцены
	function drawScene() 	
	{	
		console.log("drawScene:"+gl)
		console.log("anvas.width"+gl.canvas.width)
		console.log("canvas.height"+gl.canvas.height)

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.enable     ( gl.DEPTH_TEST );
		gl.depthFunc  ( gl.LEQUAL );

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0); 
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var uniformTextureFlag = gl.getUniformLocation(shaderProgram, "uTextureFlag");
		gl.uniform1i(uniformTextureFlag, parameters.textureId);

		var uniformShadingFlag = gl.getUniformLocation(shaderProgram, "uShadingFlag");
		gl.uniform1i(uniformShadingFlag, parameters.shadingId);

		var uniformLightFlag = gl.getUniformLocation(shaderProgram, "uLightFlag");
		gl.uniform1i(uniformLightFlag, parameters.lightingId);

		var uniformShininess = gl.getUniformLocation(shaderProgram, "uShininess");
		gl.uniform1f(uniformShininess, parameters.lightParams.shininess);

		var lin_attenuation = gl.getUniformLocation(shaderProgram, "lin_attenuation");
		gl.uniform1f(lin_attenuation, parameters.lightParams.lin_attenuation);

		var quad_attenuation = gl.getUniformLocation(shaderProgram, "quad_attenuation");
		gl.uniform1f(quad_attenuation, parameters.lightParams.quad_attenuation);

		var texture_contrib = gl.getUniformLocation(shaderProgram, "texture_contrib");
		gl.uniform1f(texture_contrib, parameters.textureParams.texture_contrib);

		setupLights(
			parameters.lightOffset,
			parameters.lightParams.ambient, 
			parameters.lightParams.diffuse,
			parameters.lightParams.specular,
			parameters.lightParams.light,
			);

		//Формирование небходимых осей
		let raxis = [];
		if (parameters.rotationId == 1) {
			raxis = [parameters.offset.x, parameters.offset.y, parameters.offset.z];
		}
		else if (parameters.rotationId == 2) {
			raxis = [0,0,0];
		}

		perspective ( 45, window.innerWidth / window.innerHeight, 0.1, 100.0 );
		console.log(parameters)
		drawFigure(
			getCubeElements(), //Model
			[parameters.offset.x-1, parameters.offset.y, parameters.offset.z], //Offset
			[parameters.rotation.x, parameters.rotation.y, parameters.rotation.z], //Rotations
			[1.0,0.0,0.0,1.0], //color
			"stone.png", //texture
			"two_texture.png", //texture2
			"bumpMap.jpg",
			0.5, //size		
			raxis // rotation axis
			);

		drawFigure(
			getCubeElements(), //Model
			[parameters.offset.x+1, parameters.offset.y, parameters.offset.z], //Offset
			[parameters.rotation.x, parameters.rotation.y, parameters.rotation.z], //Rotations
			[0.0,1.0,0.0,1.0], //color
			"ground_texture.png", //texture
			"three_texture.png", //texture2
			"bumpMap.jpg",
			0.5, //size		
			raxis // rotation axis
			);

		drawFigure(
			getCubeElements(), //Model
			[parameters.offset.x, parameters.offset.y, parameters.offset.z], //Offset
			[parameters.rotation.x, parameters.rotation.y, parameters.rotation.z], //Rotations
			[0.0,0.0,1.0,1.0], //color
			"cobblestone.png", //texture
			"stone.png", //texture2
			"bumpMap.jpg",
			0.5, //size		
			raxis // rotation axis
			);

		drawFigure(
			getCubeElements(), //Model
			[parameters.offset.x, parameters.offset.y+1, parameters.offset.z], //Offset
			[parameters.rotation.x, parameters.rotation.y, parameters.rotation.z], //Rotations
			[0.0,1.0,1.0,1.0], //color
			"wood_texture.png", //texture
			"one_texture.png", //texture2
			"bumpMap.jpg", //texture3
			0.5, //size		
			raxis // rotation axis
			);

		//Пример прозрачного кубика

		/*drawFigure(
			models.sphere,
			[parameters.offset.x, parameters.offset.y, parameters.offset.z], //Offset
			[parameters.rotation.x, parameters.rotation.y, parameters.rotation.z], //Rotations
			[1.0,0.0,0.0,1.0], //color
			"orange.jpg", //texture
			"orange.jpg", //texture2
			"orange_ao.jpg", //texture3
			0.7, //size		
			raxis
			);*/

		gl.flush();
	}