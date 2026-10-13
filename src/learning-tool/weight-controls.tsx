import type { WeightConfig } from './types';

interface Props {
  config: WeightConfig;
  onChange: (focus: number) => void;
}

export function WeightControls({ config, onChange }: Props) {
  return (
    <div className="weight-controls">
      <label className="toggle-groups">
        <span>Focus</span>
        <input
          type="range"
          min={1}
          max={3}
          step={1}
          value={config.focus ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
      <p className="focus-explanation">
        Moving the focus changes how strongly the model prefers high-weight words. Higher focus gives more
        confident, narrower answers; lower focus gives looser, more random ones.
      </p>
    </div>
  );
}
