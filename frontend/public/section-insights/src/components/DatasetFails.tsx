import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Scatterplot } from '../graphs/Scatterplot';

const DatasetFails = ({ datasetId }) => {
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
							"avgAvg",
							"failAvg"
						],
						"ORDER": "avgAvg",
					},
					"TRANSFORMATIONS": {
						"GROUP": [
							datasetId + "_dept"
						],
						"APPLY": [
							{
								"avgAvg": {
									"AVG": datasetId + "_avg"
								}
							},
							{
								"failAvg": {
									"AVG": datasetId + "_fail"
								}
							}
						]
					}
                });
                const transformedData = response.data.result.map((item: { [x: string]: any; }) => ({
                    x: item[`failAvg`],
                    y: item[`avgAvg`]
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

    return (
        <div>
            <h2>Relationship between number of fails and averages for {datasetId}</h2>
            <Scatterplot width={width} height={height} data={data}/>
        </div>
    );
};

export default DatasetFails;
