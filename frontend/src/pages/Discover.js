import React, { useEffect, useState } from 'react';
import api from '../services/api';
import NodeCard from '../components/NodeCard';

export default function Discover() {
  const [nodes, setNodes]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/nodes')
      .then(res => { setNodes(res.data.nodes); setFiltered(res.data.nodes); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(nodes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.description || '').toLowerCase().includes(q) ||
      (n.category || '').toLowerCase().includes(q)
    ));
  }, [search, nodes]);

  if (loading) return <div className="flex justify-center mt-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Discover Nodes</h1>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, description or category..."
          className="w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          {search ? `No nodes found for "${search}"` : 'No public nodes available yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(n => <NodeCard key={n.id} node={n} />)}
        </div>
      )}
    </div>
  );
}
