import PropTypes from 'prop-types';
import './buttons.css';

export default function ButtonGroup({ options = [], selected, onSelect, size = 'md', variant = 'blue' }) {
  return (
    <div
      className="button-group-outline"
      style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap' }}
    >
      {options.map((opt) => {
        // Handle both string and { label, value } formats
        const label = typeof opt === 'string' ? opt : opt.label;
        const value = typeof opt === 'string' ? opt : opt.value;

        const isActive = selected === value;
        const className = [
          'button',
          'button-outline',
          variant,
          size === 'sm' ? 'button-sm' : size === 'lg' ? 'button-lg' : '',
          isActive ? 'active' : ''
        ].join(' ').trim();

        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={className}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

ButtonGroup.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ])
  ).isRequired,
  selected: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.string,
};
