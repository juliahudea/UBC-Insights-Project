import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Histogram } from '../graphs/Histogram';

const DatasetAverages = ({ datasetId }) => {
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
                const averages = response.data.result.map((item: { [x: string]: any; }) => item[`deptAvg`]);
                setData(averages);
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
            <h2>Average Distribution for {datasetId}</h2>
    		<Histogram width={width} height={height} data={data} />
        </div>
    );
};

export default DatasetAverages;
