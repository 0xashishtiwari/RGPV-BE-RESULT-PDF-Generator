import express from 'express';
const router = express.Router();
import generate from '../controller/generateController.js';

router.post("/generate" ,generate )

export default router;