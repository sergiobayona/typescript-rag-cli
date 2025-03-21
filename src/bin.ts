import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error('\x1b[31mError: OPENAI_API_KEY environment variable is not set.\x1b[0m');
  console.error('Please create a .env file with your OpenAI API key or set it in your environment.');
  console.error('Example: OPENAI_API_KEY=your_api_key_here');
  process.exit(1);
}

import { program } from './cli';
program.parse(process.argv);