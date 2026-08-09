export interface ModelArtifact {
    schema: string;
    target: string;
    engine_version: string;
    feature_names: string[];
    w: number[];
    b: number;
    impute_median: number[];
    prevalence_train: number;
    prevalence_target: number | null;
    risk_bands?: { band: string; min: number; max_exclusive: number }[];
}

export interface PatientInput {
    age_years?: number | null;
    sex?: 'male' | 'female';
    bmi?: number | null;
    smoker?: boolean | null;
    told_high_chol?: number | null;
    physically_active?: number | null;
    // other fields as needed based on feature_names
    [key: string]: any; 
}

/**
 * Calculates the disease risk probability using the offline exported JSON model.
 */
export function calculateRiskScore(patientInput: PatientInput, modelJson: ModelArtifact): number {
    const { w, b, feature_names, impute_median } = modelJson;
    let totalScore = b;

    for (let i = 0; i < feature_names.length; i++) {
        const feature = feature_names[i];
        let value: number | null = null;

        // Convert booleans/strings to numerical values expected by the model
        if (feature === 'sex_female') {
            if (patientInput.sex === 'female') value = 1.0;
            else if (patientInput.sex === 'male') value = 0.0;
        } else if (feature === 'smoker_current') {
            if (patientInput.smoker === true) value = 1.0;
            else if (patientInput.smoker === false) value = 0.0;
        } else {
            const rawVal = patientInput[feature];
            value = (rawVal === undefined || rawVal === null || isNaN(Number(rawVal))) 
                ? null 
                : Number(rawVal);
        }

        // Apply median imputation for missing values
        if (value === null) {
            value = impute_median[i];
        }

        totalScore += w[i] * value;
    }

    // Sigmoid function
    return 1 / (1 + Math.exp(-totalScore));
}

/**
 * Determines the risk band based on probability and model artifact thresholds.
 */
export function getRiskBand(probability: number, modelJson?: ModelArtifact): string {
    let bands = modelJson?.risk_bands;

    if (!bands || bands.length === 0) {
        bands = [
            { band: 'low', min: 0.00, max_exclusive: 0.10 },
            { band: 'moderate', min: 0.10, max_exclusive: 0.25 },
            { band: 'high', min: 0.25, max_exclusive: 1.01 }
        ];
    }

    for (const band of bands) {
        if (probability >= band.min && probability < band.max_exclusive) {
            return band.band;
        }
    }
    return 'high'; // Default fallback for extreme edge cases
}
