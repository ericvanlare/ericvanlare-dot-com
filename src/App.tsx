import { Routes, Route } from 'react-router-dom';
import { ThemeToggle } from './components/ThemeToggle';
import Home from './pages/Home';
import PaintMyCity from './pages/PaintMyCity';

function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/paintmycity" element={<PaintMyCity />} />
      </Routes>
    </>
  );
}

export default App;
