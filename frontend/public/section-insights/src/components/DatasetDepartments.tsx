import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bargraph } from '../graphs/Bargraph';

const DatasetDepartments = ({ datasetId }) => {
    const [data, setData] = useState([]);
	const width = 500;
	const height = 400;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.post(`http://localhost:4321/query`, {
					"WHERE": {},
						"OPTIONS": {
							"COLUMNS": [
								datasetId + "_dept",
								"deptAvg"
							],
							"ORDER": "deptAvg"
						},
					"TRANSFORMATIONS": {
						"GROUP": [
							datasetId + "_dept"
						],
						"APPLY": [
							{
								"deptAvg": {
									"AVG": datasetId + "_avg"
								}
							}
						]
					}
				});
                const transformedData = response.data.result.map((item: { [x: string]: any; }) => ({
					dept: item[`${datasetId}_dept`],
                    avg: item[`deptAvg`]
				}));
				setData(transformedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (datasetId) {
            fetchData();
        }
    }, [datasetId]);

    // D3 chart rendering logic goes here similar to DatasetAverages
    // You would adjust it to represent max/min data
	let bargraphData = data;
	if (data.length > 12) {
		bargraphData = data.slice(-12)
	}
    return (
        <div>
            <h2>Top 12 averages across departments for {datasetId}</h2>
            <Bargraph width={width} height={height} data={bargraphData}/>
        </div>
    );
};

export default DatasetDepartments;
