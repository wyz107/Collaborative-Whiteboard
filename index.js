let express = require("express");
let app = express();
let httpServer = require("http").createServer(app);
let WebSocket = require("ws");
let wss = new WebSocket.Server({ server: httpServer });

let connections = [];
let nextID = 0;
let usedColors = new Set();
let drawingHistory = []; 

function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getUniqueColor() {
    let color;
    do {
        color = generateRandomColor();
    } while (usedColors.has(color));
    usedColors.add(color);
    return color;
}

wss.on("connection", (ws) => {
    ws.id = nextID++;
    ws.color = getUniqueColor();
    ws.send(JSON.stringify({ type: "assign_id_and_color", id: ws.id, color: ws.color }));
    ws.send(JSON.stringify({ type: "history", history: drawingHistory })); 
    connections.push(ws);
    console.log("A user connected");

    ws.on("message", (data) => {
        let message = JSON.parse(data);
        if (["ondraw", "ondown", "clear", "erase"].includes(message.type)) { 
            let broadcastMessage = {
                type: message.type,
                id: ws.id,
                color: ws.color
            };

            if (message.type === "clear") {
                drawingHistory.push({
                    type: "clear",
                    timestamp: Date.now()
                });
            } else if (message.type === "erase") {
                broadcastMessage.x = message.x;
                broadcastMessage.y = message.y;
                drawingHistory.push(broadcastMessage);
            } else {
                broadcastMessage.x = message.x;
                broadcastMessage.y = message.y;
                drawingHistory.push(broadcastMessage);
            }

            connections.forEach((con) => {
                if (con !== ws && con.readyState === WebSocket.OPEN) {
                    con.send(JSON.stringify(broadcastMessage));
                }
            });
        }
    });


    ws.on("close", () => {
        console.log("User disconnected");
        connections = connections.filter((con) => con !== ws);
        usedColors.delete(ws.color);
    });
});

app.use(express.static("public"));

let PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));