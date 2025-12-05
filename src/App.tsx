
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProjectShowcase } from './pages/ProjectShowcase';
import { multiStoreProject } from './projects/multiStore';
import { albayaderProject } from './projects/albayader';
import { beautyProject } from './projects/beauty';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/multi-store-ecommerce" element={<ProjectShowcase project={multiStoreProject} />} />
        <Route path="/projects/albayader-bakery" element={<ProjectShowcase project={albayaderProject} />} />
        <Route path="/projects/beauty-cosmetics" element={<ProjectShowcase project={beautyProject} />} />
      </Routes>
    </Router>
  );
}

export default App;
