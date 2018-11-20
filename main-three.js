
const scenes = [];

let renderer;

let meshShape;
let meshSphere;
let meshPlane;

let linesMeshShape;
let linesMeshSphere;
let linesMeshPlane;

const myDataShape = copyData3D({...data});
const myDataSphere = copyData3D({...data});
const myDataPlane = copyData3D({...data});

const particles = myDataShape.nodes.length;
const numLines = myDataShape.edges.length;

const radius = Math.min(1000, Math.max(100, Math.sqrt(particles * Math.PI * 20) * 4));

const myColors = [
    [255, 255, 0],
    [0, 0, 255],
    [0, 120, 0],
    [0, 120, 120],
    [0, 120, 255],
    [120, 0, 0],
    [120, 120, 0],
    [120, 120, 255],
    [120, 255, 0],
    [120, 255, 120],
    [120, 255, 255],
];

const canvas = document.getElementById( "c" );
const template = document.getElementById( "template" ).text;
const content = document.getElementById( "content" );

const pxRatio = window.devicePixelRatio;
const h = canvas.clientHeight;
const w = canvas.clientWidth / 3;
const W = w * pxRatio;
const H = h * pxRatio;
const Rmax = pxRatio;
const Z = Math.max(W / 2 + Rmax, H / 2 + Rmax);

const width = canvas.clientWidth / 2;
const height = canvas.clientHeight;

const vertexShader = [
    'precision highp float;\n' +
    '\n' +
    'uniform mat4 modelViewMatrix;\n' +
    'uniform mat4 projectionMatrix;\n' +
    '\n' +
    'attribute vec3 position;\n' +
    '\n' +
    'void main() {\n' +
    '\n' +
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz , 1.0);\n' +
    '\n' +
    '}'
].join('\n');
const fragmentShader = [
    'precision highp float;',
    '',
    'uniform float opacity;',
    'uniform vec3 color;',
    '',
    'void main() {',
    '',
    '	gl_FragColor = vec4(color, opacity);',
    '',
    '}'
].join('\n');

const uniforms = {
    opacity:   { value: 0.25 },
    color: {value: new THREE.Vector3(0.18, 0.18, 0.18)}
};

const linesMaterial = new THREE.RawShaderMaterial( {
    uniforms:       uniforms,
    vertexShader:   vertexShader,
    fragmentShader: fragmentShader,
    transparent:    true,
});

const vertexShaderNode = [
    '  precision highp float;',
    '',
    '  uniform mat4 modelViewMatrix;',
    '  uniform mat4 projectionMatrix;',
    '',
    '  attribute vec3 position;',
    '  attribute vec3 color;',
    '',
    '  varying vec3 vColor;',
    '',
    '  void main() {',
    '',
    '    vColor = color;',
    '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz , 1.0);',
    '',
    '    gl_PointSize = (' + Rmax.toString() + '.0 * 30.0) * (300.0 / length(gl_Position.xyz));',
    '',
    '  }'
].join('\n');

const fragmentShaderNode = [
    '  precision highp float;',
    '',
    '  uniform sampler2D map;',
    '',
    '  varying vec3 vColor;',
    '',
    '  void main() {',
    '',
    '    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);',
    '    vec4 textureColor = vec4(texture2D(map, uv));',
    '    gl_FragColor = vec4(textureColor * vec4(vColor, 1.0));',
    '',
    '    if (gl_FragColor.a >= 0.6) gl_FragColor.a = 1.0;',
    '',
    '    if (gl_FragColor.a < 0.6) discard;',
    '',
    '  }'
].join('\n');

const uniformsNode = {
    map: { type: 't', value: new THREE.TextureLoader().load('https://i.imgur.com/JXC2TVB.png')},
};

const nodeMaterial = new THREE.RawShaderMaterial( {
    uniforms: uniformsNode,
    vertexShader: vertexShaderNode,
    fragmentShader: fragmentShaderNode,
    transparent: true
});

init();
animate();

function init() {

    // SHAPE (LEFT)
    initShape();

    // PLANE (center)
    initPlane();
    
    // SPHERE (RIGHT)
    initSphere();

    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    renderer.setClearColor( 0xffffff, 1 );
    renderer.setPixelRatio( window.devicePixelRatio );
}

function initShape() {
    const scene = new THREE.Scene();

    const element = document.createElement( "div" );
    element.className = "list-item";
    element.innerHTML = template.replace( '$', 'SHAPE');
    scene.userData.element = element.querySelector( ".scene" );
    content.appendChild( element );

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
    camera.position.z = radius + 400;
    camera.lookAt(scene.position);
    scene.userData.camera = camera;

    const controls =  new THREE.OrbitControls(scene.userData.camera, scene.userData.element);
    controls.enablePan = true;
    controls.zoomSpeed = 1.2;
    controls.enableZoom = true;
    scene.userData.controls = controls;

    scenes.push(scene);

    // ADD SHAPE
    startShape();
}

function initSphere() {
    const scene = new THREE.Scene();

    const element = document.createElement( "div" );
    element.className = "list-item";
    element.innerHTML = template.replace( '$', 'SPHERE');
    scene.userData.element = element.querySelector( ".scene" );
    content.appendChild( element );

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
    camera.position.z = radius + 400;
    camera.lookAt(scene.position);
    camera.zoomSpeed = 1.2;
    camera.enableZoom = true;
    scene.userData.camera = camera;

    const controls =  new THREE.OrbitControls(scene.userData.camera, scene.userData.element);
    controls.zoomSpeed = 1.2;
    controls.enableZoom = true;
    scene.userData.controls = controls;

    scenes.push(scene);

    // ADD SHAPE
    startSphere();
}

function initPlane() {
    const scene = new THREE.Scene();

    const element = document.createElement( "div" );
    element.className = "list-item";
    element.innerHTML = template.replace( '$', '2D');
    scene.userData.element = element.querySelector( ".scene" );
    content.appendChild( element );

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
    camera.position.z = 1050;
    camera.lookAt(scene.position);
    scene.userData.camera = camera;

    const controls =  new THREE.OrbitControls(scene.userData.camera, scene.userData.element);
    controls.zoomSpeed = 1.2;
    controls.enableZoom = true;
    scene.userData.controls = controls;

    scenes.push(scene);

    // ADD SHAPE
    startPlane();
}

function updateSize() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if ( canvas.width !== width || canvas.height !== height ) {
        renderer.setSize( width, height, false );
    }
}

function animate() {
    render();
    requestAnimationFrame( animate );
}

function render() {
    updateSize();
    renderer.setClearColor( 0x000000 );
    renderer.setScissorTest( false );
    renderer.clear();
    renderer.setClearColor( 0xe0e0e0 );
    renderer.setScissorTest( true );
    scenes.forEach( function ( scene ) {
        if (scene.children[0] !== undefined) {
            // get the element that is a place holder for where we want to
            // draw the scene
            const element = scene.userData.element;
            // get its position relative to the page's viewport
            const rect = element.getBoundingClientRect();
            // check if it's offscreen. If so skip it
            if ( rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
                rect.right < 0 || rect.left > renderer.domElement.clientWidth ) {
                return; // it's off screen
            }
            // set the viewport
            const width = rect.right - rect.left;
            const height = rect.bottom - rect.top;
            const left = rect.left;
            const top = rect.top;
            renderer.setViewport( left, top, width, height );
            renderer.setScissor( left, top, width, height );
            const camera = scene.userData.camera;
            //camera.aspect = width / height; // not changing in this example
            //camera.updateProjectionMatrix();
            //scene.userData.controls.update();
            renderer.render( scene, camera );
        }
    } );
}

function startSphere() {

    const bounds = [0, 0, Math.PI, Math.PI * 2];

    somS.randomize3D(myDataSphere.nodes, bounds);

    setTimeout(function () {
        somS(myDataSphere, {
            dontRandomize: true,
            bounds: bounds,
            onEnd: () => {},
            iterationsPerUpdate: 5,
            updateDelay: 16.666666,
            onUpdate: getSphere
        });
    }, 1000);

    getSphere();
}

function getSphere() {

    if (meshSphere !== undefined && scenes.length > 2) {
        scenes[2].remove(meshSphere);
    }

    const particle_system_geometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(particles * 4 * 3)); // For positioning
    const colorBuffer = new Uint8Array(new ArrayBuffer(particles * 3)); // For giving color to nodes

    for (let i = 0; i < particles; i++) {

        const angle1 = myDataSphere.nodes[i].x;
        const angle2 = myDataSphere.nodes[i].y;

        const posX = radius * Math.sin(angle1) * Math.cos(angle2);
        const posY = radius * Math.sin(angle1) * Math.sin(angle2);
        const posZ = radius * Math.cos(angle1);

        positionBuffer[(i * 3)]     = posX;
        positionBuffer[(i * 3) + 1] = posY;
        positionBuffer[(i * 3) + 2] = posZ;

        colorBuffer[(i * 3)]     = myColors[myDataSphere.nodes[i].group][0];
        colorBuffer[(i * 3) + 1] = myColors[myDataSphere.nodes[i].group][1];
        colorBuffer[(i * 3) + 2] = myColors[myDataSphere.nodes[i].group][2];

    }

    let nodeBufferPosition  = new THREE.InterleavedBuffer(positionBuffer, 3);
    let nodeBufferColor     = new THREE.InterleavedBuffer(colorBuffer, 3);

    particle_system_geometry.addAttribute('position', new THREE.InterleavedBufferAttribute(nodeBufferPosition, 3, 0, false));
    particle_system_geometry.addAttribute('color', new THREE.InterleavedBufferAttribute(nodeBufferColor, 3, 0, true));

    meshSphere = new THREE.Points(particle_system_geometry, nodeMaterial);

    scenes[2].add(meshSphere);

    getSphereRelations();
}

function getSphereRelations() {
    
    if (linesMeshSphere !== undefined && scenes.length > 1) {
        scenes[2].remove(linesMeshSphere);
    }

    const linesGeometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(numLines * 2 * 12)); // For positioning

    for (let r = 0; r < myDataSphere.edges.length; r++) {

        const source = myDataSphere.nodes.filter(x => x.id === myDataSphere.edges[r].source)[0];
        const target = myDataSphere.nodes.filter(x => x.id === myDataSphere.edges[r].target)[0];

        const source_angle1 = source.x;
        const source_angle2 = source.y;

        const target_angle1 = target.x;
        const target_angle2 = target.y;

        const source_posX = radius * Math.sin(source_angle1) * Math.cos(source_angle2);
        const source_posY = radius * Math.sin(source_angle1) * Math.sin(source_angle2);
        const source_posZ = radius * Math.cos(source_angle1);

        const target_posX = radius * Math.sin(target_angle1) * Math.cos(target_angle2);
        const target_posY = radius * Math.sin(target_angle1) * Math.sin(target_angle2);
        const target_posZ = radius * Math.cos(target_angle1);

        // FROM
        positionBuffer[(r * 6)]     = source_posX;
        positionBuffer[(r * 6) + 1] = source_posY;
        positionBuffer[(r * 6) + 2] = source_posZ;

        // TO
        positionBuffer[(r * 6) + 3] = target_posX;
        positionBuffer[(r * 6) + 4] = target_posY;
        positionBuffer[(r * 6) + 5] = target_posZ;
    }

    const nodeBufferPosition = new THREE.InterleavedBuffer(positionBuffer, 3);

    linesGeometry.addAttribute('position', new THREE.InterleavedBufferAttribute(nodeBufferPosition, 3, 0, false));

    linesMeshSphere = new THREE.LineSegments( linesGeometry, linesMaterial );

    scenes[2].add(linesMeshSphere);
}

function startPlane() {

    const bounds = [-W / 2 + Rmax, -H / 2 + Rmax, W / 2 - Rmax, H / 2 - Rmax];

    som.randomize(myDataPlane.nodes, bounds);

    setTimeout(() => {
        this.som(myDataPlane, {
            dontRandomize: true,
            bounds: bounds,
            onEnd: () => {},
            iterationsPerUpdate: 5,
            updateDelay: 16.666666,
            onUpdate: getPlane
        });
    }, 1000);

    getPlane();
}

function getPlane() {
    if (meshPlane !== undefined && scenes.length > 1) {
        scenes[1].remove(meshPlane);
    }

    const particle_system_geometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(particles * 4 * 3)); // For positioning
    const colorBuffer = new Uint8Array(new ArrayBuffer(particles * 3)); // For giving color to nodes

    for (let i = 0; i < particles; i++) {

        const posX = myDataPlane.nodes[i].x;
        const posY = myDataPlane.nodes[i].y;
        const posZ = 0;

        positionBuffer[(i * 3)]     = posX;
        positionBuffer[(i * 3) + 1] = posY;
        positionBuffer[(i * 3) + 2] = posZ;

        colorBuffer[(i * 3)]     = myColors[myDataPlane.nodes[i].group][0];
        colorBuffer[(i * 3) + 1] = myColors[myDataPlane.nodes[i].group][1];
        colorBuffer[(i * 3) + 2] = myColors[myDataPlane.nodes[i].group][2];

    }

    let nodeBufferPosition  = new THREE.InterleavedBuffer(positionBuffer, 3);
    let nodeBufferColor     = new THREE.InterleavedBuffer(colorBuffer, 3);

    particle_system_geometry.addAttribute('position', new THREE.InterleavedBufferAttribute(nodeBufferPosition, 3, 0, false));
    particle_system_geometry.addAttribute('color', new THREE.InterleavedBufferAttribute(nodeBufferColor, 3, 0, true));

    meshPlane = new THREE.Points(particle_system_geometry, nodeMaterial);

    scenes[1].add(meshPlane);

    getPlaneRelations();
}

function getPlaneRelations() {
    if (linesMeshPlane !== undefined && scenes.length > 1) {
        scenes[1].remove(linesMeshPlane);
    }

    const linesGeometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(numLines * 2 * 12)); // For positioning

    for (let r = 0; r < myDataPlane.edges.length; r++) {

        const source = myDataPlane.nodes.filter(x => x.id === myDataPlane.edges[r].source)[0];
        const target = myDataPlane.nodes.filter(x => x.id === myDataPlane.edges[r].target)[0];

        const source_posX = source.x;
        const source_posY = source.y;
        const source_posZ = 0;

        const target_posX = target.x;
        const target_posY = target.y;
        const target_posZ = 0;

        // FROM
        positionBuffer[(r * 6)]     = source_posX;
        positionBuffer[(r * 6) + 1] = source_posY;
        positionBuffer[(r * 6) + 2] = source_posZ;

        // TO
        positionBuffer[(r * 6) + 3] = target_posX;
        positionBuffer[(r * 6) + 4] = target_posY;
        positionBuffer[(r * 6) + 5] = target_posZ;
    }

    const nodeBufferPosition = new THREE.InterleavedBuffer(positionBuffer, 3);

    linesGeometry.addAttribute('position', new THREE.InterleavedBufferAttribute(nodeBufferPosition, 3, 0, false));

    linesMeshPlane = new THREE.LineSegments( linesGeometry, linesMaterial );

    scenes[1].add(linesMeshPlane);
}

function startShape() {

    const bounds = [-W / 2 + Rmax, -H / 2 + Rmax, -Z, W / 2 - Rmax, H / 2 - Rmax, Z];

    som3D.randomize3D(myDataShape.nodes, bounds);

    setTimeout(function () {
        som3D(myDataShape, {
            dontRandomize: true,
            bounds: bounds,
            onEnd: () => {},
            iterationsPerUpdate: 5,
            updateDelay: 16.666666,
            onUpdate: getShape
        });
    }, 1000);

    getShape();
}

function getShape() {

    if (meshShape !== undefined && scenes.length > 0) {
        scenes[0].remove(meshShape);
    }

    const particle_system_geometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(particles * 4 * 3)); // For positioning
    const colorBuffer = new Uint8Array(new ArrayBuffer(particles * 3)); // For giving color to nodes

    for (let i = 0; i < particles; i++) {

        const posX = myDataShape.nodes[i].x;
        const posY = myDataShape.nodes[i].y;
        const posZ = myDataShape.nodes[i].z;

        positionBuffer[(i * 3)]     = posX;
        positionBuffer[(i * 3) + 1] = posY;
        positionBuffer[(i * 3) + 2] = posZ;

        colorBuffer[(i * 3)]     = myColors[myDataShape.nodes[i].group][0];
        colorBuffer[(i * 3) + 1] = myColors[myDataShape.nodes[i].group][1];
        colorBuffer[(i * 3) + 2] = myColors[myDataShape.nodes[i].group][2];

    }

    let nodeBufferPosition  = new THREE.InterleavedBuffer(positionBuffer, 3);
    let nodeBufferColor     = new THREE.InterleavedBuffer(colorBuffer, 3);

    particle_system_geometry.addAttribute('position', new THREE.InterleavedBufferAttribute(nodeBufferPosition, 3, 0, false));
    particle_system_geometry.addAttribute('color', new THREE.InterleavedBufferAttribute(nodeBufferColor, 3, 0, true));

    meshShape = new THREE.Points(particle_system_geometry, nodeMaterial);

    scenes[0].add(meshShape);

    getShapeRelations();
}

function getShapeRelations() {
    if (linesMeshShape !== undefined && scenes.length > 0) {
        scenes[0].remove(linesMeshShape);
    }

    const linesGeometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(numLines * 2 * 12)); // For positioning

    for (let r = 0; r < myDataShape.edges.length; r++) {

        const source = myDataShape.nodes.filter(x => x.id === myDataShape.edges[r].source)[0];
        const target = myDataShape.nodes.filter(x => x.id === myDataShape.edges[r].target)[0];

        // FROM
        positionBuffer[(r * 6)]     = source.x;
        positionBuffer[(r * 6) + 1] = source.y;
        positionBuffer[(r * 6) + 2] = source.z;

        // TO
        positionBuffer[(r * 6) + 3] = target.x;
        positionBuffer[(r * 6) + 4] = target.y;
        positionBuffer[(r * 6) + 5] = target.z;
    }

    const nodeBufferPosition = new THREE.InterleavedBuffer(positionBuffer, 3);

    linesGeometry.addAttribute('position', new THREE.InterleavedBufferAttribute(nodeBufferPosition, 3, 0, false));


    linesMeshShape = new THREE.LineSegments( linesGeometry, linesMaterial );

    scenes[0].add(linesMeshShape);
}

function copyData3D(dataToCopy) {
    // edges: {source: string, target: string, value: number}[]
    // nodes: {group: number, id: string, x: number, y: number}[]

    const nodesRet = [];
    const edgesRet = [];

    for (const e of dataToCopy.edges) {
        const source = e.source;
        const target = e.target;
        const value  = e.value;

        edgesRet.push({source: source, target: target, value: value});
    }

    for (const n of dataToCopy.nodes) {
        const group = n.group;
        const id = n.id;
        const x = n.x;
        const y = n.y;

        nodesRet.push({group: group, id: id, x: x, y: y, z: 0});
    }

    return {edges: edgesRet, nodes: nodesRet};
}
