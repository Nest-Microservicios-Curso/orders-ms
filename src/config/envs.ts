import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  PRODUCTS_MS_HOST: string;
  PRODUCTS_MS_PORT: number;
}

const envSchemaValidator = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string(),
    PRODUCTS_MS_: joi.string(),
    PRODUCTS_MS_PORT: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envSchemaValidator.validate(process.env);

if (error) {
  throw new Error(`Config(.env) has error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  dbUrl: envVars.DATABASE_URL,
  PRODUCTS_MS_HOST: envVars.PRODUCTS_MS_HOST,
  PRODUCTS_MS_PORT: envVars.PRODUCTS_MS_PORT,
};
