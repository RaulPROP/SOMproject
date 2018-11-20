
let camera_s;
let scene_s;
let renderer_s;
let mesh_s;
let linesMesh_s;
let canvas_s;
let radius_s;
let particles_s;
let controller_s;
const myData_s = copyDataS({...data});

const numLines_s = myData_s.edges.length;

const myColors_s = [
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

    particles_s = myData_s.nodes.length;

    canvas_s = document.querySelector('canvas#three');
    const width = canvas_s.clientWidth;
    const height = canvas_s.clientHeight;

    scene_s = new THREE.Scene();
    scene_s.background = new THREE.Color(0xFFFFFF);

    scene_s.position.x = 0;
    scene_s.position.y = 0;
    scene_s.position.z = 0;

    camera_s = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
    camera_s.position.z = 300;
    camera_s.lookAt(scene_s.position);

    controller_s = new THREE.TrackballControls(camera_s, canvas_s);

    controller_s.rotateSpeed = 1;
    controller_s.zoomSpeed = 1.5;

    controller_s.noZoom = false;
    controller_s.noPan = true;

    controller_s.staticMoving = false;
    controller_s.dynamicDampingFactor = 0.2;

    controller_s.keys = [ 65, 83, 68 ];

    controller_s.addEventListener( 'change', render3d );

    window.addEventListener( 'resize', onWindowResize, false );

    renderer_s = new THREE.WebGLRenderer({
        canvas: canvas_s,
        antialias: true
    });
    renderer_s.setSize( width, height );

    startSOM3D();
}

function onWindowResize() {
    const width = canvas_s.clientWidth;
    const height = canvas_s.clientHeight;

    camera_s.aspect = width / height;
    camera_s.updateProjectionMatrix();
    renderer_s.setSize(width, height);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controller_s.handleResize();
    controller_s.update();
    render3d();
}

function render3d() {
    renderer_s.render(scene_s, camera_s);
}

function startSOM3D() {
    const pxRatio = window.devicePixelRatio;
    const h = canvas_s.clientHeight;
    const w = canvas_s.clientWidth;
    const W = w * pxRatio;
    const H = h * pxRatio;
    const Rmax = 5 * pxRatio;

    const bounds = [0, 0, Math.PI, Math.PI * 2];

    somS.randomize3D(myData_s.nodes, bounds);

    setTimeout(function () {
        somS(myData_s, {
            dontRandomize: true,
            bounds: bounds,
            onEnd: function () {
                console.log('sphere done');
            },
            iterationsPerUpdate: 5,
            updateDelay: 16.666666,
            onUpdate: onUpdate3D
        });
    }, 1000);

}

function onUpdate3D() {

    if (mesh_s !== undefined) {
        scene_s.remove(mesh_s);
    }

    const particle_system_geometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(particles_s * 4 * 3)); // For positioning
    const colorBuffer = new Uint8Array(new ArrayBuffer(particles_s * 3)); // For giving color to nodes

    radius_s = Math.min(1000, Math.max(100, Math.sqrt(particles_s * Math.PI * 20)));

    for (let i = 0; i < particles_s; i++) {

        const angle1 = myData_s.nodes[i].x;
        const angle2 = myData_s.nodes[i].y;

        const posX = radius_s * Math.sin(angle1) * Math.cos(angle2);
        const posY = radius_s * Math.sin(angle1) * Math.sin(angle2);
        const posZ = radius_s * Math.cos(angle1);

        positionBuffer[(i * 3)]     = posX;
        positionBuffer[(i * 3) + 1] = posY;
        positionBuffer[(i * 3) + 2] = posZ;

        colorBuffer[(i * 3)]     = myColors_s[myData_s.nodes[i].group][0];
        colorBuffer[(i * 3) + 1] = myColors_s[myData_s.nodes[i].group][1];
        colorBuffer[(i * 3) + 2] = myColors_s[myData_s.nodes[i].group][2];

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
        '    gl_PointSize = 15.0 * (300.0 / length(gl_Position.xyz));\n' +
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

    mesh_s = new THREE.Points(particle_system_geometry, nodeMaterial);

    scene_s.add(mesh_s);

    relations();

}

function relations() {

    if (linesMesh_s !== undefined) {
        scene_s.remove(linesMesh_s);
    }

    const linesGeometry = new THREE.BufferGeometry();

    // Buffers
    const positionBuffer = new Float32Array(new ArrayBuffer(numLines_s * 2 * 12)); // For positioning

    for (let r = 0; r < myData_s.edges.length; r++) {

        const source = myData_s.nodes.filter(x => x.id === myData_s.edges[r].source)[0];
        const target = myData_s.nodes.filter(x => x.id === myData_s.edges[r].target)[0];

        const source_angle1 = source.x;
        const source_angle2 = source.y;

        const target_angle1 = target.x;
        const target_angle2 = target.y;
        
        const source_posX = radius_s * Math.sin(source_angle1) * Math.cos(source_angle2);
        const source_posY = radius_s * Math.sin(source_angle1) * Math.sin(source_angle2);
        const source_posZ = radius_s * Math.cos(source_angle1);
        
        const target_posX = radius_s * Math.sin(target_angle1) * Math.cos(target_angle2);
        const target_posY = radius_s * Math.sin(target_angle1) * Math.sin(target_angle2);
        const target_posZ = radius_s * Math.cos(target_angle1);
        
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

    linesMesh_s = new THREE.LineSegments( linesGeometry, linesMaterial );

    scene_s.add(linesMesh_s);

}

function copyDataS(dataToCopy) {
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

        nodesRet.push({group: group, id: id, x: x, y: y});
    }

    return {edges: edgesRet, nodes: nodesRet};
}


