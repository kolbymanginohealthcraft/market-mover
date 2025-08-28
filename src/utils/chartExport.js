import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Export chart as PNG image
export const exportAsPNG = async (chartElement, filename = 'chart.png') => {
  console.log('exportAsPNG called with:', { chartElement: !!chartElement, filename });
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error exporting as PNG:', error);
    throw new Error('Failed to export as PNG');
  }
};

// Export chart as SVG
export const exportAsSVG = (chartElement, filename = 'chart.svg') => {
  try {
    // Find SVG element within the chart
    const svgElement = chartElement.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true);
    
    // Get actual chart dimensions
    const chartRect = chartElement.getBoundingClientRect();
    const width = Math.round(chartRect.width);
    const height = Math.round(chartRect.height);
    
    // Set proper SVG attributes for vector scaling
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Remove any transform attributes that might interfere
    clonedSvg.removeAttribute('transform');
    
    // Add a white background rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', '#ffffff');
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);

    // Add comprehensive CSS styles for better control and editing
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      /* Bar colors - easily customizable */
      .recharts-bar-rectangle { fill: #3FB985; stroke: #2E8B57; stroke-width: 1; }
      .recharts-bar-rectangle:hover { fill: #2E8B57; }
      
      /* Axis styling */
      .recharts-cartesian-axis-line { stroke: #666; stroke-width: 1; }
      .recharts-cartesian-axis-tick-line { stroke: #666; stroke-width: 1; }
      .recharts-cartesian-axis-tick-value { fill: #666; font-size: 12px; font-family: Arial, sans-serif; }
      
      /* Grid lines */
      .recharts-cartesian-grid-horizontal line { stroke: #f0f0f0; stroke-width: 1; }
      .recharts-cartesian-grid-vertical line { stroke: #f0f0f0; stroke-width: 1; }
      
      /* Text elements */
      .recharts-text { font-family: Arial, sans-serif; }
      
      /* Disable tooltips in exported version */
      .recharts-tooltip-wrapper { pointer-events: none; display: none; }
      
      /* Ensure proper scaling */
      * { vector-effect: non-scaling-stroke; }
    `;
    clonedSvg.appendChild(style);

    // Convert SVG to string
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    
    // Add XML declaration and DOCTYPE for better compatibility
    const fullSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgData}`;
    
    const svgBlob = new Blob([fullSvgContent], { type: 'image/svg+xml;charset=utf-8' });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(svgBlob);
    link.click();
    
    URL.revokeObjectURL(link.href);
    
    console.log('SVG exported successfully with dimensions:', { width, height });
  } catch (error) {
    console.error('Error exporting as SVG:', error);
    throw new Error('Failed to export as SVG');
  }
};

// Export chart as PDF
export const exportAsPDF = async (chartElement, filename = 'chart.pdf') => {
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    
    const imgWidth = 297; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    throw new Error('Failed to export as PDF');
  }
};

// Export chart data as CSV
export const exportAsCSV = (data, filename = 'chart-data.csv') => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data available for CSV export');
    }

    // Get headers from the first data object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error exporting as CSV:', error);
    throw new Error('Failed to export as CSV');
  }
};

// Main export function that handles all formats
export const exportChart = async (format, chartElement, data = null, filename = null) => {
  console.log('exportChart called with:', { format, chartElement: !!chartElement, data: !!data, filename });
  
  const timestamp = new Date().toISOString().slice(0, 10);
  const defaultFilename = `benchmark-chart-${timestamp}`;
  
  switch (format) {
    case 'png':
      await exportAsPNG(chartElement, filename || `${defaultFilename}.png`);
      break;
    case 'svg':
      exportAsSVG(chartElement, filename || `${defaultFilename}.svg`);
      break;
    case 'pdf':
      await exportAsPDF(chartElement, filename || `${defaultFilename}.pdf`);
      break;
    case 'csv':
      if (!data) {
        throw new Error('Data is required for CSV export');
      }
      exportAsCSV(data, filename || `${defaultFilename}.csv`);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
