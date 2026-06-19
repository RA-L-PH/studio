'use server';
/**
 * @fileOverview A Genkit flow for generating explanations of estimated wait times.
 *
 * - explainWaitTimeFactors - A function that handles generating a wait time explanation.
 * - ExplainWaitTimeFactorsInput - The input type for the explainWaitTimeFactors function.
 * - ExplainWaitTimeFactorsOutput - The return type for the explainWaitTimeFactors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainWaitTimeFactorsInputSchema = z.object({
  numPatientsInQueue: z
    .number()
    .describe('The current number of patients waiting in the queue.'),
  averageConsultationDurationMs: z
    .number()
    .describe('The average duration of a consultation in milliseconds.'),
});
export type ExplainWaitTimeFactorsInput = z.infer<
  typeof ExplainWaitTimeFactorsInputSchema
>;

const ExplainWaitTimeFactorsOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the estimated wait time.'),
});
export type ExplainWaitTimeFactorsOutput = z.infer<
  typeof ExplainWaitTimeFactorsOutputSchema
>;

export async function explainWaitTimeFactors(
  input: ExplainWaitTimeFactorsInput
): Promise<ExplainWaitTimeFactorsOutput> {
  return explainWaitTimeFactorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainWaitTimeFactorsPrompt',
  input: {schema: ExplainWaitTimeFactorsInputSchema},
  output: {schema: ExplainWaitTimeFactorsOutputSchema},
  prompt:
    'You are a helpful assistant for a clinic reception.
Given the following information, provide a clear, concise, and professional explanation of the current estimated wait time.

Factors to consider:
- Number of patients in queue: {{{numPatientsInQueue}}}
- Average consultation duration: {{averageConsultationDurationMs}} milliseconds

Based on these factors, what is the estimated wait time for a patient joining the queue now? Your explanation should be easy for a patient to understand and manage their expectations, incorporating these specific details.',
});

const explainWaitTimeFactorsFlow = ai.defineFlow(
  {
    name: 'explainWaitTimeFactorsFlow',
    inputSchema: ExplainWaitTimeFactorsInputSchema,
    outputSchema: ExplainWaitTimeFactorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
