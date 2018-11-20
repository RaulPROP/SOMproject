let camera;
let scene;
let renderer;
let mesh;
let linesMesh;
let canvas;
let radius;
let particles;
let controller;
const myData = {...data};
const myData_s = copyData3D({...data});

const numLines = myData.edges.length;

const myColors = [
    [0, 0, 120],
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


init3D();
animate();

function init3D() {

    particles = myData.nodes.length;

    canvas = document.querySelector('canvas#three');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);

    scene.position.x = 0;
    scene.position.y = 0;
    scene.position.z = 0;

    camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
    camera.position.z = 1050;
    camera.lookAt(scene.position);

    controller = new THREE.TrackballControls(camera, canvas);

    controller.rotateSpeed = 1;
    controller.zoomSpeed = 1.5;

    controller.noZoom = false;
    controller.noPan = true;

    controller.staticMoving = false;
    controller.dynamicDampingFactor = 0.2;

    controller.keys = [ 65, 83, 68 ];

    controller.addEventListener( 'change', render3d );

    window.addEventListener( 'resize', onWindowResize, false );

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize( width, height );

    startSOM3D();
}

function onWindowResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controller.handleResize();
    controller.update();
    render3d();
}

function render3d() {
    renderer.render(scene, camera);
}

function startSOM3D() {
    const pxRatio = window.devicePixelRatio;
    const h = canvas.clientHeight;
    const w = canvas.clientWidth;
    const W = w * pxRatio;
    const H = h * pxRatio;
    const Rmax = 5 * pxRatio;

    const Z = Math.max(W / 2 + Rmax, H / 2 + Rmax);

    const bounds = [-W / 2 + Rmax, -H / 2 + Rmax, -Z, W / 2 - Rmax, H / 2 - Rmax, Z];

    som3D.randomize3D(myData.nodes, bounds);

    setTimeout(function () {
        som3D(myData, {
            dontRandomize: true,
            bounds: bounds,
            onEnd: function () {
                console.log('shape done');
            },
            iterationsPerUpdate: 5,
            updateDelay: 16.666666,
            onUpdate: onUpdate3D
        });
    }, 1000);

}

function onUpdate3D() {

    if (mesh !== undefined) {
        scene.remove(mesh);
    }

    const particle_system_geometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(particles * 4 * 3)); // For positioning
    const colorBuffer = new Uint8Array(new ArrayBuffer(particles * 3)); // For giving color to nodes

    radius = Math.min(1000, Math.max(100, Math.sqrt(particles * Math.PI * 20)));

    for (let i = 0; i < particles; i++) {

        const posX = myData.nodes[i].x;
        const posY = myData.nodes[i].y;
        const posZ = myData.nodes[i].z;

        positionBuffer[(i * 3)]     = posX;
        positionBuffer[(i * 3) + 1] = posY;
        positionBuffer[(i * 3) + 2] = posZ;

        colorBuffer[(i * 3)]     = myColors[myData.nodes[i].group][0];
        colorBuffer[(i * 3) + 1] = myColors[myData.nodes[i].group][1];
        colorBuffer[(i * 3) + 2] = myColors[myData.nodes[i].group][2];

    }

    let nodeBufferPosition  = new THREE.InterleavedBuffer(positionBuffer, 3);
    let nodeBufferColor     = new THREE.InterleavedBuffer(colorBuffer, 3);

    particle_system_geometry.addAttribute('position', new THREE.InterleavedBufferAttribute(nodeBufferPosition, 3, 0, false));
    particle_system_geometry.addAttribute('color', new THREE.InterleavedBufferAttribute(nodeBufferColor, 3, 0, true));

    let vertexShader =
        '  precision highp float;\n' +
        '\n' +
        '  uniform mat4 modelViewMatrix;\n' +
        '  uniform mat4 projectionMatrix;\n' +
        '\n' +
        '  attribute vec3 position;\n' +
        '  attribute vec3 color;\n' +
        '\n' +
        '  varying vec3 vColor;\n' +
        '\n' +
        '  void main() {\n' +
        '\n' +
        '    vColor = color;\n' +
        '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz , 1.0);\n' +
        '\n' +
        '    gl_PointSize = 30.0 * (300.0 / length(gl_Position.xyz));\n' +
        '\n' +
        '  }';

    let fragmentShader =
        '  precision highp float;\n' +
        '\n' +
        '  uniform sampler2D map;\n' +
        '\n' +
        '  varying vec3 vColor;\n' +
        '\n' +
        '  void main() {\n' +
        '\n' +
        '    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);\n' +
        '    vec4 textureColor = vec4(texture2D(map, uv));\n' +
        '    gl_FragColor = vec4(textureColor * vec4(vColor, 1.0));\n' +
        '\n' +
        '    if (gl_FragColor.a >= 0.6) gl_FragColor.a = 1.0;\n' +
        '\n' +
        '    if (gl_FragColor.a < 0.6) discard;\n' +
        '\n' +
        '  }';

    let uniforms = {
        map: { type: 't', value: new THREE.TextureLoader().load('https://i.imgur.com/JXC2TVB.png')},
    };

    let nodeMaterial = new THREE.RawShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
    });

    mesh = new THREE.Points(particle_system_geometry, nodeMaterial);

    scene.add(mesh);

    relations();

}

function relations() {

    if (linesMesh !== undefined) {
        scene.remove(linesMesh);
    }

    const linesGeometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(numLines * 2 * 12)); // For positioning

    for (let r = 0; r < myData.edges.length; r++) {

        const source = myData.nodes.filter(x => x.id === myData.edges[r].source)[0];
        const target = myData.nodes.filter(x => x.id === myData.edges[r].target)[0];

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

    linesMesh = new THREE.LineSegments( linesGeometry, linesMaterial );

    scene.add(linesMesh);

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