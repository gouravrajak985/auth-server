import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pugly Auth Server API',
      version: '1.0.0',
      description: 'Multi-Platform SaaS Authentication System with JWT and SSO',
      contact: {
        name: 'Gourav Rajak',
        email: 'gourav@pugly.store'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:4000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            is_verified: { type: 'boolean' },
            globalRoles: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['user', 'super_admin', 'merchant', 'partner']
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            data: { type: 'object' },
            message: { type: 'string' },
            success: { type: 'boolean' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            message: { type: 'string' },
            success: { type: 'boolean', default: false }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };