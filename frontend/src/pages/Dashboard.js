import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import NodeCard from '../components/NodeCard';

export default function Dashboard() {
  const [myNodes, setMyNodes]   = useState([]);
  const [subNodes, setSubNodes] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.get('/nodes/mine'), api.get('/nodes/subscribed')])
      .then(([mine, subs]) => {
        setMyNodes(mine.data.nodes);
        setSubNodes(subs.data.nodes);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center mt-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">My Nodes</h2>
        <Link to="/nodes/new" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Create Node
        </Link>
      </div>

      {myNodes.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 mb-8">
          <p className="text-lg mb-2">No nodes yet</p>
          <p className="text-sm">Create your first node to start publishing updates.</p>
          <Link to="/nodes/new" className="mt-4 inline-block text-blue-600 font-medium hover:underline text-sm">Create a Node →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {myNodes.map(n => <NodeCard key={n.id} node={n} />)}
        </div>
      )}

      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-xl font-bold text-gray-800">Subscribed Nodes</h2>
        <Link to="/discover" className="text-sm text-blue-600 hover:underline font-medium">Discover more →</Link>
      </div>

      {subNodes.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
          <p className="text-lg mb-2">No subscriptions yet</p>
          <p className="text-sm">Browse and subscribe to nodes to start receiving alerts.</p>
          <Link to="/discover" className="mt-4 inline-block text-blue-600 font-medium hover:underline text-sm">Discover Nodes →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subNodes.map(n => <NodeCard key={n.id} node={n} showSubscription />)}
        </div>
      )}
    </div>
  );
}
