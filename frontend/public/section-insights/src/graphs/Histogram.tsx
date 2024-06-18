import { useMemo , useRef , useEffect } from "react";
import * as d3 from "d3";
import React from "react";

const BUCKET_PADDING = 4;
const MARGIN = { top: 30, right: 30, bottom: 40, left: 30 };

type HistogramProps = {
  width: number;
  height: number;
  data: number[];
};

export const Histogram = ({ width, height, data }: HistogramProps) => {
	const axesRef = useRef(null);
	const boundsWidth = width - MARGIN.right - MARGIN.left;
  	const boundsHeight = height - MARGIN.top - MARGIN.bottom;

	const xScale = useMemo(() => {
	return d3
		.scaleLinear()
		.domain([50, 100])
		.range([10, boundsWidth]);
	}, [boundsWidth]);

	const buckets = useMemo(() => {
		const bucketGenerator = d3
		  .bin()
		  .value((d) => d)
		  .domain(xScale.domain())
		  .thresholds(xScale.ticks(10));
		return bucketGenerator(data);
	  }, [data, xScale]);

	const yScale = useMemo(() => {
    	const max = Math.max(...buckets.map((bucket) => bucket?.length));
    	return d3.scaleLinear().range([boundsHeight, 0]).domain([0, max]).nice();
  	}, [boundsHeight, buckets]);

	useEffect(() => {
		const svgElement = d3.select(axesRef.current);
		svgElement.selectAll("*").remove();

		const xAxisGenerator = d3.axisBottom(xScale);
		svgElement
			.append("g")
			.attr("transform", "translate(0," + boundsHeight + ")")
			.call(xAxisGenerator);

		const yAxisGenerator = d3.axisLeft(yScale);
		svgElement.append("g").call(yAxisGenerator);
	}, [xScale, yScale, boundsHeight]);

	const allRects = buckets.map((bucket, i) => {
		return (
			<rect
			key={i}
			fill="#69b3a2"
			x={xScale(bucket.x0) + BUCKET_PADDING / 2}
			width={xScale(bucket.x1) - xScale(bucket.x0) - BUCKET_PADDING}
			y={yScale(bucket.length)}
			height={boundsHeight - yScale(bucket.length)}
			/>
		);
	});

	return (
		<svg width={width} height={height}>
			<g
			width={boundsWidth}
			height={boundsHeight}
			transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
			>
			{allRects}
			</g>
			<g
			width={boundsWidth}
			height={boundsHeight}
			ref={axesRef}
			transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
			/>
		</svg>
	);
};

