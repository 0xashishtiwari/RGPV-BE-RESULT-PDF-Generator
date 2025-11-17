import express from "express";
import bodyParser from "body-parser";
import main from "./pdf/generatepdf.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import router from "./routes/routes.js";   // to handle the generate routes
import { initSocket } from "./utils/socket.js";

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

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
app.use(router);

// ---------------------------------------
server.listen(3000, () => {
    console.log("Server running on port 3000");
});
