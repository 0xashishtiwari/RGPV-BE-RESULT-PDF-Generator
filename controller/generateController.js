import getIO from "../utils/socket.js";
import main from "../pdf/generatepdf.js";
import fs from "fs";

const generate =  async (req, res) => {
    try {
        const { collegeCode, branch, year, startNum, endNum, semester, socketId } = req.body;
        const io = getIO();  // get the global io instance

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
}


export default generate;