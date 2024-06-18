import React, { useMemo } from "react";
import * as d3 from "d3";

const MARGIN = { top: 20, right: 40, bottom: 20, left: 40 };
const BAR_PADDING = 0.3;

type BargraphProps = {
	width: number;
	height: number;
	data: { dept: string; avg: number }[];
};

export const Bargraph = ({ width, height, data }: BargraphProps ) => {
	const boundsWidth = width - MARGIN.right - MARGIN.left;
  	const boundsHeight = height - MARGIN.top - MARGIN.bottom;
	const max = Math.max(...data.map(d => d.avg));
	const min = Math.min(...data.map(d => d.avg));

	const groups = data.sort((a, b) => b.avg- a.avg).map((d) => d.dept);

	const xScale = useMemo(() => {
		return d3
		  .scaleBand()
		  .domain(groups)
		  .range([0, boundsWidth])
		  .padding(BAR_PADDING);
	}, [boundsWidth, groups]);

	const yScale = useMemo(() => {
		return d3
		  .scaleLinear()
		  .domain([min-1, max])
		  .range([boundsHeight, 0]);
	}, [boundsHeight, max]);

	const allShapes = data.map((d, i) => {
		const x = xScale(d.dept);
		if (x === undefined) {
			return null;
		}

		return (
			<g key={i}>
				<rect
				fill="#00A36C"
				x={xScale(d.dept)}
				width={xScale.bandwidth()}
				y={yScale(d.avg)}
				height={boundsHeight - yScale(d.avg)}
				/>
				<text
				y={boundsHeight + 10}
				x={x + xScale.bandwidth() / 2}
				textAnchor="middle"
				fontSize={12}
				>
				{d.dept}
				</text>
			</g>
		);
	});

	const grid = yScale.ticks(5).map((value, i) => (
		<g key={i} >
			<line
			x1={0}
			x2={boundsWidth}
			y1={yScale(value)}
			y2={yScale(value)}
			stroke="#808080"
			opacity={0.2}
			/>
			<text
			x={-10}
			y={yScale(value)}
			textAnchor="end"
			alignmentBaseline="middle"
			fontSize={9}
			fill="#808080"
			opacity={0.8}
			>
			{value}
			</text>
		</g>
	));

	return (
		<div>
			<svg width={width} height={height}>
				<g
				width={boundsWidth}
				height={boundsHeight}
				transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
				>
				{grid}
				{allShapes}
				</g>
			</svg>
		</div>
	);
  };
