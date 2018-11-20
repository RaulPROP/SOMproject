
const myColors2D = [
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

function init2D() {
    const canvas = document.querySelector('canvas#two');


    const h = canvas.clientHeight;
    const w = canvas.clientWidth;
    const ctx    = canvas.getContext('2d');

    const pxRatio = window.devicePixelRatio;

    const W = w * pxRatio;
    const H = h * pxRatio;

    canvas.width        = W;
    canvas.height       = H;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    ctx.translate(W / 2, H / 2);

    const idMap = data.nodes.reduce(function (acc, node, i) {
        acc[node.id] = i;
        return acc;
    }, {});
    const Rmax = 5 * pxRatio;
    const bounds = [-W / 2 + Rmax, -H / 2 + Rmax, W / 2 - Rmax, H / 2 - Rmax];

    const myData = {...data};
    
    // gonna be randomized anyway, that's just for the demo
    som.randomize(myData.nodes, bounds);
    render();


    function render() {
        const nodes = myData.nodes;
        const edges = myData.edges;

        ctx.clearRect(-W/2, -H/2, W, H);

        ctx.beginPath();
        edges.forEach((e) => { drawLink(e, ctx, idMap); });
        ctx.strokeStyle = '#aaa';
        ctx.stroke();

        ctx.beginPath();
        nodes.forEach((n) => { drawNode(n, ctx); });
        ctx.fill();
        ctx.strokeStyle = 'transparent';
        ctx.stroke();
    }

    function drawLink(d, ctx, idMap) {
        const source = myData.nodes[idMap[d.source]];
        const target = myData.nodes[idMap[d.target]];
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
    }

    function drawNode(d, ctx) {
        const r = d.size || Rmax;
        ctx.moveTo(d.x + r, d.y);
        ctx.arc(d.x, d.y, r, 0, 2 * Math.PI);
    }
    
    setTimeout(() => {
        this.som(myData, {
            dontRandomize: true,
            bounds: bounds,
            onUpdate: render,
            onEnd: function () {
                console.log('2D done');
            },
            iterationsPerUpdate: 5,
            updateDelay: 16.666666
        });
    }, 1000);

    let dragging    = false;
    let tolerance   = Rmax * 2;
    let draggedNode = null;
    let dragTimer   = 0;

    canvas.addEventListener('mousedown', function (evt) {
        dragging = true;
        const ex = bounds[0] + evt.clientX * pxRatio,
            ey = bounds[1] + evt.clientY * pxRatio;

        setTimeout(function () {
            for (let i = 0, len = myData.nodes.length; i < len; i++) {
                const node = myData.nodes[i];
                const dx = ex - node.x,
                    dy = ey - node.y;

                if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
                    draggedNode = node;
                    break;
                }
            }
        }, 0)
    });

    canvas.addEventListener('mousemove', (evt) => {
        if (dragging && draggedNode) {
            draggedNode.x = bounds[0] + evt.clientX * pxRatio;
            draggedNode.y = bounds[1] + evt.clientY * pxRatio;

            clearTimeout(dragTimer);
            dragTimer = setTimeout(render, 16);
        }
    });

    canvas.addEventListener('mouseup', () => {
        dragging    = false;
        draggedNode = null;
    });

    window.onresize = () => {
        render();
    };
}

init2D();