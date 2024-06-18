import React, { useEffect, useState } from 'react';
import DatasetAverages from './DatasetAverages';
import DatasetFails from './DatasetFails';
import DatasetDepartments from './DatasetDepartments';

function DatasetList() {
    const [datasets, setDatasets] = useState([]);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [selectedInsight, setSelectedInsight] = useState('');

    useEffect(() => {
        fetchDatasets();
    }, []);

    const fetchDatasets = async () => {
        try {
            const response = await fetch('/datasets');
            if (!response.ok) {
                throw new Error('Failed to fetch datasets');
            }
            const result = await response.json();
            setDatasets(result.result);
        } catch (error) {
            alert(`Error fetching datasets: ${error.message}`);
        }
    };

	const handleDatasetClick = (datasetId: any) => {
		setSelectedDataset(datasetId);
		setSelectedInsight('');
	};

    const renderInsightComponent = () => {
        switch (selectedInsight) {
            case 'Averages':
                return <DatasetAverages datasetId={selectedDataset} />;
            case 'Fails':
                return <DatasetFails datasetId={selectedDataset} />;
            case 'Departments':
                return <DatasetDepartments datasetId={selectedDataset} />;
            default:
                return null;
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
			<div>
				<h2>Available Datasets</h2>
				<ul>
					{datasets.map((dataset: { id: string }) => (
						<li key={dataset.id} onClick={() => handleDatasetClick(dataset.id)}>{dataset.id}</li>
					))}
				</ul>
			</div>
            {selectedDataset && (
                <div>
                    <button onClick={() => setSelectedInsight('Averages')}>Averages</button>
                    <button onClick={() => setSelectedInsight('Fails')}>Fails</button>
                    <button onClick={() => setSelectedInsight('Departments')}>Departments</button>
                    {renderInsightComponent()}
                </div>
            )}
        </div>
    );
}

export default DatasetList;
