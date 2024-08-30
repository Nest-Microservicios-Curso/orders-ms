import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
}

const envSchemaValidator = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string(),
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
};
