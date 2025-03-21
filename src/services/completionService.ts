import { openai } from '../utils/openai';

/**
 * Generate a completion response from OpenAI's chat API
 * 
 * This function sends a user message to OpenAI's chat completion API
 * and returns the generated text response.
 * 
 * @param userMessage - User prompt or query to send to the AI model
 * @param model - OpenAI model name to use (defaults to gpt-4o-mini)
 * @returns Promise containing the AI-generated text response
 * @throws Error if the API call fails or returns no content
 * 
 * @example
 * // Basic usage with default model
 * const answer = await runCompletion("What is RAG?");
 * 
 * // Using a specific model
 * const answer = await runCompletion("Explain quantum computing", "gpt-4");
 */
export async function runCompletion(userMessage: string, model: string = 'gpt-4o-mini'): Promise<string> {
  const response = await openai.chat.completions.create({
    model: model,
    messages: [{ role: 'user', content: userMessage }],
    temperature: 0.0
  });
  
  return response.choices[0].message.content || '';
}