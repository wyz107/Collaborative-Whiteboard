## Collaborative Whiteboard
This is a collaborative whiteboard application built using Node.js, Express, WebSocket, and HTML5 Canvas. It allows multiple users to draw and erase on a shared canvas in real-time.
## Structure
    ├── ReadMe.md           // 帮助文档
    │   ├── index.html
    ├── AutoCreateDDS.py    // 合成DDS的 python脚本文件
    
    ├── DDScore             
    ├── public/
    │   ├── index.html
    │   ├── style.css
    │   ├── script.js
    ├── index.js
    ├── README.md
    ├── package.json

## Usage
- *Drawing*: Click and drag on the canvas to draw.
- *Erasing*: Click the "Erase" button to switch to erase mode. Click and drag on the canvas to erase.
- *Clearing*: Click the "Clear" button to clear the entire canvas.

## Install the App

- Install the latest NodeJs (version >= 12)
- Clone the app
- Run `npm install` inside the folder
- Start the server `node index.js` 
- Open your browser and navigate to http://localhost:8080 to access the whiteboard.
