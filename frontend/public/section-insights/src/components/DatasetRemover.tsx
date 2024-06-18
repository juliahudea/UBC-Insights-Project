import React, { useState } from 'react';

function DatasetRemover({ onRemoveSuccess }) {
    const [datasetId, setDatasetId] = useState('');

    const handleRemoveDataset = async () => {
        if (!datasetId) {
            alert('Please enter a dataset ID to remove.');
            return;
        }

        try {
            const response = await fetch(`/dataset/${datasetId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            alert('Dataset removed successfully.');
            onRemoveSuccess(); // Callback to trigger any post-removal actions
        } catch (error) {
			console.log(error)
            alert(`Error removing dataset: ${(error as Error).message}`);
        }
	};

    return (
        <div>
            <h2>Remove Dataset</h2>
            <input
                type="text"
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                placeholder="Dataset ID"
            />
            <button onClick={handleRemoveDataset}>Remove</button>
        </div>
    );
}

export default DatasetRemover;
