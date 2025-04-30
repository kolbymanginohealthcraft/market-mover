import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import '../../styles/base.css';

export default function ButtonGroup({ options = [], selected, onSelect }) {
  return (
    <div style={{ display: 'inline-flex', gap: '0.5rem', position: 'relative', flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <motion.button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`filter-button ${selected === opt ? 'active' : ''}`}
          animate={{
            backgroundColor: selected === opt ? "#3FB985" : "#f5f5f5",
            color: selected === opt ? "white" : "#265947",
            borderColor: selected === opt ? "#2e9065" : "#ccc",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {opt}
        </motion.button>
      ))}
    </div>
  );
}
