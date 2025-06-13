
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import IndexPage from './pages/Index';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
      </Routes>
      <Toaster theme="dark" position="bottom-right" richColors />
    </BrowserRouter>
  );
}
