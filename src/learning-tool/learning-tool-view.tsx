import { useState } from 'react';
import { AutoTokenizer } from '@huggingface/transformers';
import { textToIds, generateReplyStream } from '../ai';
import type { ReasoningStep, TokenInfo } from './types';
import { WeightControls } from './weight-controls';
import { WeightVisualization } from './weight-visualization';

export function LearningToolView() {
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(1);
  const [numberView, setNumberView] = useState<TokenInfo[] | null>(null);
  const [modelInput, setModelInput] = useState<{ inputIds: number[]; attentionMask: number[]; positionIds: number[] } | null>(null);
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setOutput('');
    setSteps([]);
    setError('');
    try {
      const ids = await textToIds(trimmed);
      const tokenizer = await AutoTokenizer.from_pretrained('smol360/config', { local_files_only: true });
      const tokenViews = await Promise.all(
        ids.map(async (id) => ({
          tokenId: id,
          tokenText: await tokenizer.decode([id], { skip_special_tokens: true }),
        })),
      );
      setNumberView(tokenViews);

      const inputIds: number[] = [...ids];
      const attentionMask: number[] = new Array(inputIds.length).fill(1);
      const positionIds: number[] = inputIds.map((_, i) => i);
      setModelInput({ inputIds, attentionMask, positionIds });

      const onToken = (_tokenId: number, tokenText: string) => {
        setOutput((prev) => prev + tokenText);
      };

      // Capture the AI's reasoning as it generates, so the read weights for
      // each step can be surfaced in the reasoning panel.
      const onReasoningStep = (step: ReasoningStep) => {
        setSteps((prev) => [...prev, step]);
      };

      await generateReplyStream(
        [],
        trimmed,
        onToken,
        120,
        onReasoningStep,
      );
    } catch (err) {
      console.error('learning run failed', err);
      setError('Sorry, the learning run could not start.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="learning-tool">
      <h2>Learning tool</h2>
      <p className="learning-tool-sub">
        See how your words become numbers, then weights, then an answer.
      </p>

      <div className="learning-tool-grid">
        <div className="panel">
          <h3>1 · Words to numbers</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a word or sentence..."
            rows={3}
          />
          <button className="primary" onClick={run} disabled={loading || !text.trim()}>
            {loading ? 'Thinking…' : 'Think'}
          </button>
        </div>

        {numberView && modelInput && (
          <div className="panel">
            <h3>2 · Numbers the model reads</h3>
            <div className="tokens">
              {numberView.map((t) => (
                <span key={t.tokenId} className="token">
                  {t.tokenText}
                  <span className="num">{t.tokenId}</span>
                </span>
              ))}
            </div>
            <div className="code-block">
              <pre>{`input_ids:    [${modelInput.inputIds}]`}</pre>
              <pre>{`attention_mask: [${modelInput.attentionMask}]`}</pre>
              <pre>{`position_ids: [${modelInput.positionIds}]`}</pre>
            </div>
          </div>
        )}

        <div className="panel">
          <h3>3 · Weights & reasoning</h3>
          <WeightControls config={{ focus }} onChange={setFocus} />
          <WeightVisualization
            tokens={numberView ?? []}
            focus={focus}
            steps={steps}
          />
          <div className="output">
            <h4>AI answer</h4>
            <p>{output || <i>Press Think to see how the numbers and weights shape the answer.</i>}</p>
            {error && <p className="error">{error}</p>}
            {steps.length > 0 && (
              <div className="reasoning">
                <h4>AI reasoning</h4>
                {steps.map((s) => (
                  <div key={s.step} className="step">
                    <span className="step-num">step {s.step} → </span>
                    <span>Chosen #{s.chosen}</span>
                    <span className="cands">
                      top contributions:
                      {s.candidateIds.map((id, i) => (
                        <span key={i} className="contribution">
                          <span className="contrib-num">#{id}</span>
                          <span className="contrib-w">{s.weights[i]}</span>
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningToolView;
