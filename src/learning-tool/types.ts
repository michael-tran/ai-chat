export interface TokenInfo {
  tokenId: number;
  tokenText: string;
}

export interface WeightConfig {
  focus: number;
}

export interface ModelInput {
  inputIds: number[];
  attentionMask: number[];
  positionIds: number[];
}

export interface ReasoningStep {
  step: number;
  chosen: number;
  candidateIds: number[];
  weights: number[];
}
