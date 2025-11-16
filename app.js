import express from "express";
import bodyParser from "body-parser";
import main from "./pdf/generatepdf.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    console.log("USER CONNECTED:", socket.id);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------------------------------
// FORM PAGE
// ---------------------------------------
app.get("/", (req, res) => {
    res.render("form");
});

// ---------------------------------------
// GENERATE PDF
// ---------------------------------------
app.post("/generate", async (req, res) => {
    try {
        const { collegeCode, branch, year, startNum, endNum, semester, socketId } = req.body;

        // Validate socket connection
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) {
            return res.status(400).send("Socket not found. Please refresh the page.");
        }

        // Build enrollment numbers
        const yearShort = String(year).slice(-2);
        const startRoll = `${collegeCode}${branch}${yearShort}${startNum}`;
        const endRoll = `${collegeCode}${branch}${yearShort}${endNum}`;

        console.log("Start:", startRoll);
        console.log("End:", endRoll);
        console.log("Semester:", semester);

        // FRONTEND LIVE STATUS
        socket.emit("status", "Generation started...");
        socket.emit("status", `Processing from ${startRoll} to ${endRoll}`);

        // Run PDF generator
        const pdfPath = await main(startRoll, endRoll, semester, socket);

        socket.emit("status", "PDF completed. Preparing download...");

        // Send PDF to client
        res.download(pdfPath, (err) => {
            if (err) {
                console.log("Download error:", err);
            }

            // Delete file after sending
            try {
                fs.unlinkSync(pdfPath);
            } catch (deleteErr) {
                console.log("Failed to delete PDF:", deleteErr);
            }
        });

    } catch (err) {
        console.error("PDF Generation Error:", err);
        return res.send("Failed to generate PDF. Check terminal for details.");
    }
});

// ---------------------------------------
server.listen(3000, () => {
    console.log("Server running on port 3000");
});
