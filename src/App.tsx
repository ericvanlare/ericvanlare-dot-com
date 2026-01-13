import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Posts from './pages/Posts';
import Post from './pages/Post';
import PaintMyCity from './pages/PaintMyCity';
import Admin from './pages/Admin';

function App() {
  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/posts/:slug" element={<Post />} />
        <Route path="/projects/paintmycity" element={<PaintMyCity />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
  );
}

export default App;
