import type { ReasoningStep, TokenInfo } from './types';

export interface WeightVisualizationProps {
  tokens: TokenInfo[];
  /** Weights derived from the focus slider. focus=1 → all equal; focus>1 → higher token ids get more weight. */
  focus: number;
  /** Per-generation reasoning steps so the user can see how weights evolve. */
  steps: ReasoningStep[];
}

/**
 * Educational UI that shows how each word the user typed becomes a number
 * (token id) and then a weight that steers the next token the model picks.
 *
 * The visual is a step-by-step row:
 *   "the" (id 123)  ▓▓▓▓▓▓▓▓▓▓  weight 0.25
 *
 * With focus=1 every word gets the same weight. Turning the focus slider up
 * redistributes weight toward the words with the highest token ids, which is
 * the same mechanism the model uses to pay more attention to some words than
 * others. The tooltip on each bar names the exact numeric weight and the model
 * step it influenced.
 */
export function WeightVisualization({
  tokens,
  focus,
  steps,
}: WeightVisualizationProps) {
  const maxId = Math.max(...tokens.map((t) => t.tokenId), 1);
  const maxAbsId = Math.max(maxId, 1);

  // Weight each token by a power of its relative id, so focus>1 pushes weight
  // toward the highest token ids. Normalize so weights sum to 1.
  const shaped = tokens.map((t) => {
    const rel = maxAbsId > 1 ? t.tokenId / maxAbsId : 1;
    return Math.pow(rel, focus - 1);
  });
  const total = shaped.reduce((a, b) => a + b, 0) || 1;
  const weights = shaped.map((v) => v / total);

  const highest = weights.indexOf(Math.max(...weights));

  return (
    <div>
      <div className="weight-steps">
        {tokens.map((t, i) => {
          const w = weights[i];
          const pct = tokens.length > 0 ? w * 100 : 0;
          const isHighest = i === highest;
          return (
            <div className="weight-row" key={t.tokenId}>
              <span className="wt-word" title={`Word: ${t.tokenText}`}>{t.tokenText}</span>
              <span className="wt-num" title={`Token id: ${t.tokenId}`}>{t.tokenId}</span>
              <div className="wt-track">
                <div
                  className={`wt-fill${isHighest ? ' wt-highest' : ''}`}
                  style={{ width: `${pct}%` }}
                  title={
                    `Weight ${w.toFixed(3)} — ${
                      focus === 1
                        ? 'equal weight, every word matters the same'
                        : `focus ${focus}: more weight is given to higher token ids`
                    }`
                  }
                />
              </div>
              <span className="wt-val" title={`Weight value: ${w.toFixed(3)}`}>
                {w.toFixed(3)}
              </span>
              <span className="wt-step" title="Reasoning step this influence affects.">
                {steps.length > 0 ? `#${steps[steps.length - 1].step}→#{steps[steps.length - 1].chosen}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
      <p className="weight-explanation">
        {focus === 1
          ? 'With focus 1, every word is worth the same. The model reads all of them equally.'
          : 'Higher focus pushes more weight toward words with higher token ids. Drag the slider to change the balance.'}
      </p>
    </div>
  );
}

export default WeightVisualization;
