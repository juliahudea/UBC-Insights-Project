import * as d3 from 'd3';
import { AxisLeft } from './AxisLeft';
import { AxisBottom } from './AxisBottom';
import React from 'react';

const MARGIN = { top: 20, right: 40, bottom: 20, left: 40 };

type ScatterplotProps = {
  width: number;
  height: number;
  data: { x: number; y: number }[];
};

export const Scatterplot = ({ width, height, data }: ScatterplotProps) => {
  // Layout. The div size is set by the given props.
  // The bounds (=area inside the axis) is calculated by substracting the margins
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // Scales
  const yScale = d3.scaleLinear().domain([0, 100]).range([boundsHeight, 0]);
  const xScale = d3.scaleLinear().domain([0, 15]).range([0, boundsWidth]);

  // Build the shapes
  const allShapes = data.map((d, i) => {
    return (
      <circle
        key={i}
        r={4}
        cx={xScale(d.x)}
        cy={yScale(d.y)}
        opacity={1}
        stroke="#cb1dd1"
        fill="#cb1dd1"
        fillOpacity={0.8}
        strokeWidth={1}
      />
    );
  });

  return (
	<svg width={width} height={height}>
	<g
		width={boundsWidth}
		height={boundsHeight}
		transform={`translate(${[MARGIN.left, MARGIN.top].join(',')})`}
	>
		{/* Y axis */}
		<AxisLeft yScale={yScale} pixelsPerTick={40} width={boundsWidth} />

		{/* X axis, use an additional translation to appear at the bottom */}
		<g transform={`translate(0, ${boundsHeight})`}>
		<AxisBottom
			xScale={xScale}
			pixelsPerTick={40}
			height={boundsHeight}
		/>
		</g>

		{/* Circles */}
		{allShapes}
	</g>
	</svg>
  );
};
