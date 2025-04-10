import React from 'react';
import { ResponsiveBar } from '@nivo/bar';

// Custom tick component to wrap labels
const CustomAxisTick = ({ x, y, width, height, value }) => {
  const maxLength = 15; // Maximum number of characters before wrapping
  const wrappedLabel = value.length > maxLength ? value.replace(/(.{15})/g, '$1\n') : value; // Add line breaks after 15 characters

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '12px',
          fill: '#333',
          whiteSpace: 'pre-line', // Enable multi-line text
        }}
        width={width}
        height={height}
      >
        {wrappedLabel}
      </text>
    </g>
  );
};

const ProviderBarChart = ({ data }) => {
  return (
    <ResponsiveBar
      data={data}
      keys={['count']}
      indexBy="type"
      margin={{ top: 20, right: 80, bottom: 20, left: 200 }} // Adjust margins
      padding={0.3}
      layout="horizontal"
      colors={['#265947', '#F1B62C', '#1DADBE', '#3FB985', '#D64550', '#26D9D8', '#3599B8', '#4AC5BB', '#5F6B6D']}
      borderRadius={2}
      axisBottom={null}
      labelPosition="end"
      labelOffset={10}
      enableGridY={false}


      axisLeft={{
        tickSize: 0,
        tickPadding: 10, // Adjust padding for the left axis
        tickRotation: 0, // Set to 0 for horizontal labels
        legendOffset: -60, // Adjust this to control the space for the labels
        tickComponent: CustomAxisTick, // Use custom tick component
      }}
    />
  );
};

export default ProviderBarChart;
