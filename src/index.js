import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { connectRedis, redisClient } from './config/redisClient.js';
import { app } from './app.js'
import logger from './utils/logger.js'
import mongoose from 'mongoose'

dotenv.config({
    path: './.env'
})

let server;

// Redis Connection
connectRedis();

// DB Connection
connectDB()
    .then(() => {
        server = app.listen(process.env.PORT || 8000, () => {
            logger.info(`⚙️ Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        logger.error("MONGO db connection failed !!! ", err);
        process.exit(1);
    })

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');
            
            try {
                // Close database connections
                await mongoose.connection.close();
                logger.info('MongoDB connection closed');
                
                await redisClient.quit();
                logger.info('Redis connection closed');
                
                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during graceful shutdown:', error);
                process.exit(1);
            }
        });
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});