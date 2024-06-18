import React, { useState } from 'react';
import axios, {AxiosError} from 'axios';

function DatasetAdder({ onUploadSuccess }) {
    const [fileData, setFileData] = useState('');
    const [datasetId, setDatasetId] = useState('');
    const [uploading, setUploading] = useState(false);

const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
	const selectedFile = event.target.files && event.target.files[0];
	if (selectedFile) {
		const reader = new FileReader();
		reader.readAsArrayBuffer(selectedFile);
		reader.onload = () => {
			setFileData((reader.result as any)!);
		};
	}
};

    const handleIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDatasetId(event.target.value);
    };

    const uploadDataset = async () => {
        if (!fileData || !datasetId) {
            alert('Please enter a dataset ID and select a file to upload.');
            return;
        }

        setUploading(true);
        try {
            const response = await axios.put(`http://localhost:4321/dataset/${datasetId}/sections`,  fileData,
				{headers: {"Content-Type": "application/x-zip-compressed"}});

            if (response.status !== 200) {
                throw new Error('Failed to upload dataset');
            }

            onUploadSuccess();
            alert('Dataset uploaded successfully.');
        } catch (error) {
			if (error instanceof AxiosError) {
				alert(`Error uploading dataset: ${(error as any).response.data.error}`);
			} else {
				alert(`Error uploading dataset: ${(error as Error).message}`);
			}

        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h2>Upload Dataset</h2>
            <input type="text" value={datasetId} onChange={handleIdChange} placeholder="Dataset ID" />
            <input type="file" onChange={handleFileChange} />
            <button onClick={uploadDataset} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
    );
}

export default DatasetAdder;
