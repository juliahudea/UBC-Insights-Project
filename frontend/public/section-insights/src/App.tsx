import React from 'react';
import './App.css';
import DatasetList from './components/DatasetList';
import DatasetAdder from './components/DatasetAdder';
import DatasetRemover from './components/DatasetRemover';

function App() {
	return (
		<div>
			<h1>Section Insights</h1>
			<DatasetAdder onUploadSuccess={() => window.location.reload()} />
			<DatasetList />
			<DatasetRemover onRemoveSuccess={() => window.location.reload()} />
		</div>
	);
}

export default App;
