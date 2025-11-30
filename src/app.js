import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import { errorHandler } from "./middleware/errorHandler.js";
import { ApiError } from "./utils/ApiError.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

const app = express()

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
app.use(generalLimiter);

// Creating a array of allowed origins from env variable
const allowed = (process.env.FRONTEND_ALLOWED_ORIGINS || "").split(",").map(s => s.trim())
    .filter(Boolean);

//  Creating a object for CORS options
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowed.includes(origin)) {
            return callback(null, true);
        }
        return callback(new ApiError(403, "CORS Policy: This origin is not allowed"));
    },
    credentials: true,
}
// Applying CORS middleware
app.use(cors("*"));

//middlewares
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/userRoutes.js'
import healthRouter from './routes/healthRoutes.js'
import { swaggerUi, specs } from './config/swagger.js'
import logger from './utils/logger.js'

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/health", healthRouter)

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});


app.use(errorHandler);


// http://localhost:8000/api/v1/users/register

export { app }