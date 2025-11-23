import { Navigate, Route, Routes } from 'react-router-dom';
import AddAsset from './pages/AddAsset.tsx';
import AssetInventory from './pages/AssetInventory.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AssetInventory />} />
      <Route path="/assets/new" element={<AddAsset />} />
      <Route path="/assets/:id/edit" element={<AddAsset />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;