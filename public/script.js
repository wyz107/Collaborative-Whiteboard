let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let mouseDown = false;
let myID;
let myColor;
let drawingStates = {};
let isErasing = false; 

function resizeCanvas() {
    const displayWidth = Math.floor(canvas.clientWidth);
    const displayHeight = Math.floor(canvas.clientHeight);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

let socket = new WebSocket("ws://localhost:8080");
socket.onopen = () => console.log("WebSocket connected");
socket.onmessage = (event) => {
    let data = JSON.parse(event.data);
    if (data.type === "assign_id_and_color") {
        myID = data.id;
        myColor = data.color;
    } else if (data.type === "ondown") {
        const pos = {
            x: data.x * canvas.width,
            y: data.y * canvas.height
        };
        if (!drawingStates[data.id]) {
            drawingStates[data.id] = {};
        }
        drawingStates[data.id].lastX = pos.x;
        drawingStates[data.id].lastY = pos.y;
    } else if (data.type === "ondraw") {
        const pos = {
            x: data.x * canvas.width,
            y: data.y * canvas.height
        };
        if (drawingStates[data.id] && drawingStates[data.id].lastX !== undefined) {
            ctx.strokeStyle = data.color;
            ctx.beginPath();
            ctx.moveTo(drawingStates[data.id].lastX, drawingStates[data.id].lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            drawingStates[data.id].lastX = pos.x;
            drawingStates[data.id].lastY = pos.y;
        }
    } else if (data.type === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (data.type === "erase") { 
        const pos = {
            x: data.x * canvas.width,
            y: data.y * canvas.height
        };
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); 
        ctx.fillStyle = "#ffffff"; 
        ctx.fill();
    } else if (data.type === "history") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        data.history.forEach(event => {
            if (event.type === "clear") {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else if (event.type === "erase") { 
                const pos = {
                    x: event.x * canvas.width,
                    y: event.y * canvas.height
                };
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); 
                ctx.fillStyle = "#ffffff";
                ctx.fill();
            } else {
                const pos = {
                    x: event.x * canvas.width,
                    y: event.y * canvas.height
                };
                
                if (event.type === "ondown") {
                    if (!drawingStates[event.id]) {
                        drawingStates[event.id] = {};
                    }
                    drawingStates[event.id].lastX = pos.x;
                    drawingStates[event.id].lastY = pos.y;
                } else if (event.type === "ondraw") {
                    if (drawingStates[event.id]) {
                        ctx.strokeStyle = event.color;
                        ctx.beginPath();
                        ctx.moveTo(drawingStates[event.id].lastX, drawingStates[event.id].lastY);
                        ctx.lineTo(pos.x, pos.y);
                        ctx.stroke();
                        drawingStates[event.id].lastX = pos.x;
                        drawingStates[event.id].lastY = pos.y;
                    }
                }
            }
        });
    }
};

canvas.addEventListener('mousedown', (e) => {
    const pos = getCanvasCoordinates(e);
    ctx.strokeStyle = myColor;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    mouseDown = true;
    
    if (!isErasing) { 
        socket.send(JSON.stringify({ 
            type: "ondown",
            x: pos.x / canvas.width,
            y: pos.y / canvas.height
        }));
    } else { 
        socket.send(JSON.stringify({
            type: "erase",
            x: pos.x / canvas.width,
            y: pos.y / canvas.height
        }));
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2); 
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }
});

canvas.addEventListener('mouseup', () => mouseDown = false);

canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    const pos = getCanvasCoordinates(e);
    
    if (!isErasing) { 
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        socket.send(JSON.stringify({
            type: "ondraw",
            x: pos.x / canvas.width,
            y: pos.y / canvas.height
        }));
    } else { 
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2); 
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        
        socket.send(JSON.stringify({
            type: "erase",
            x: pos.x / canvas.width,
            y: pos.y / canvas.height
        }));
    }
});

document.getElementById("clear").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingStates = {};
    socket.send(JSON.stringify({ type: "clear" }));
});

document.getElementById("erase").addEventListener("click", () => {
    isErasing = !isErasing;
    document.getElementById("erase").textContent = isErasing ? "Draw" : "Erase";
});