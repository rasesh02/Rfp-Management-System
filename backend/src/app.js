import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express();
app.use(cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:8000', 'http://127.0.0.1:5173'],
    credentials: true
}))

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser())

// Import routes
import rfpRouter from './routes/rfp.routes.js'
import vendorRouter from './routes/vendor.routes.js'
import proposalRouter from './routes/proposal.routes.js'
import comparisonRouter from './routes/comparison.routes.js'

// Setup routes
app.use('/v1/rfp', rfpRouter);
app.use('/v1/vendor', vendorRouter);
app.use('/v1/proposal', proposalRouter);
app.use('/v1/comparison', comparisonRouter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
});

export {app}