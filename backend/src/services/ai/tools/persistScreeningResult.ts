import { NotificationType } from "@prisma/client";
import { prisma } from "../../../config/database";
import { createNotification } from "../../../modules/notifications/notifications.service";

export async function persistScreeningResult(
  patientId: string,
  notifyUserId: string,
  inputSnapshot: unknown,
  output: { diabetes?: { band: string }; hypertension?: { band: string }; cvd?: { band: string } }
) {
  const analysis = await prisma.aIAnalysis.create({
    data: {
      patientId,
      analysisType: "CHRONIC_DISEASE_SCREENING",
      source: "ML_SERVICE",
      inputSnapshot: inputSnapshot as any,
      output: output as any,
      confidence: 1.0,
    },
  });

  const isHighRisk =
    output.diabetes?.band === "high" || output.hypertension?.band === "high" || output.cvd?.band === "high";

  if (isHighRisk) {
    await createNotification(
      notifyUserId,
      NotificationType.DIAGNOSIS_CREATED,
      "URGENT: High Risk Screening Alert",
      "Patient flagged for high risk of chronic disease. Mandatory PHC referral required.",
      output as any
    );
  }

  return analysis;
}
