import { openai } from '../utils/openai';

/**
 * Generate completion from OpenAI's chat API
 * @param userMessage - User prompt to send to the model
 * @param model - Model to use (defaults to gpt-4o-mini)
 * @returns Promise containing the model's response
 */
export async function runCompletion(userMessage: string, model: string = 'gpt-4o-mini'): Promise<string> {
  const response = await openai.chat.completions.create({
    model: model,
    messages: [{ role: 'user', content: userMessage }],
    temperature: 0.0
  });
  
  return response.choices[0].message.content || '';
}