/**
 * @fileOverview A utility for generating explanations of estimated wait times.
 * Replaces the previous Genkit flow with a deterministic calculation.
 */

export type ExplainWaitTimeFactorsInput = {
  numPatientsInQueue: number;
  averageConsultationDurationMs: number;
};

export type ExplainWaitTimeFactorsOutput = {
  explanation: string;
};

export async function explainWaitTimeFactors(
  input: ExplainWaitTimeFactorsInput
): Promise<ExplainWaitTimeFactorsOutput> {
  const { numPatientsInQueue, averageConsultationDurationMs } = input;
  
  if (numPatientsInQueue === 0) {
    return { explanation: "There is currently no wait time. You can proceed to the reception for immediate assistance." };
  }

  const avgMinutes = Math.round(averageConsultationDurationMs / 60000);
  const totalWaitMinutes = Math.round((numPatientsInQueue * averageConsultationDurationMs) / 60000);

  let waitMessage = "";
  if (totalWaitMinutes < 15) {
    waitMessage = "The queue is moving quickly.";
  } else if (totalWaitMinutes < 45) {
    waitMessage = "The clinic is moderately busy.";
  } else {
    waitMessage = "We are currently experiencing high patient volume.";
  }

  return {
    explanation: `${waitMessage} There are ${numPatientsInQueue} patients currently waiting. With an average visit time of ${avgMinutes} minutes, your estimated wait is approximately ${totalWaitMinutes} minutes.`
  };
}
