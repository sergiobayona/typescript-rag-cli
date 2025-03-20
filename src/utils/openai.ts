import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});