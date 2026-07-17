// Mock API — replaces real axios calls so the frontend runs without a backend.

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ─── In-memory store ─────────────────────────────────────────────────────────
let users = [
  { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', password: 'password', created_at: new Date().toISOString() },
  { id: 'u2', name: 'Bob Smith',     email: 'bob@example.com',   password: 'password', created_at: new Date().toISOString() },
];

let nodes = [
  { id: 'n1', owner_id: 'u1', title: 'Announcements',   description: 'Company-wide announcements and news.',       category: 'General',     is_public: true, owner_name: 'Alice Johnson', subscriber_count: '3', update_count: '2', created_at: new Date().toISOString() },
  { id: 'n2', owner_id: 'u1', title: 'Product Releases', description: 'Notifications for new product launches.',    category: 'Product',     is_public: true, owner_name: 'Alice Johnson', subscriber_count: '5', update_count: '1', created_at: new Date().toISOString() },
  { id: 'n3', owner_id: 'u2', title: 'Deadlines',         description: 'Upcoming project and submission deadlines.', category: 'Engineering', is_public: true, owner_name: 'Bob Smith',     subscriber_count: '2', update_count: '3', created_at: new Date().toISOString() },
  { id: 'n4', owner_id: 'u2', title: 'HR Updates',        description: 'Human resources policies and benefits.',     category: 'HR',          is_public: true, owner_name: 'Bob Smith',     subscriber_count: '1', update_count: '0', created_at: new Date().toISOString() },
];

// schedule_type: 'immediate' | 'specific_datetime' | 'specific_days' | 'every_x_days'
// status: 'open' | 'closed'
let updates = [
  {
    id: 'upd1', node_id: 'n1', author_id: 'u1', author_name: 'Alice Johnson', status: 'open',
    content: 'Welcome to WatsonX Nodes! This is the official announcements channel. Subscribe to stay informed.',
    schedule_type: 'immediate', schedule_config: {},
    posted_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'upd2', node_id: 'n1', author_id: 'u1', author_name: 'Alice Johnson', status: 'open',
    content: 'Office will be closed on Friday for a public holiday. Enjoy the long weekend!',
    schedule_type: 'specific_datetime', schedule_config: { datetime: new Date(Date.now() + 3600000 * 5).toISOString().slice(0, 16) },
    posted_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'upd3', node_id: 'n2', author_id: 'u1', author_name: 'Alice Johnson', status: 'open',
    content: 'v2.0 is now live! Check the release notes on the portal for full details.',
    schedule_type: 'specific_days', schedule_config: { days: ['Mon', 'Wed', 'Fri'], time: '09:00' },
    posted_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'upd4', node_id: 'n3', author_id: 'u2', author_name: 'Bob Smith', status: 'open',
    content: 'Q2 report submission deadline is this Friday at 5PM. Please submit via the project portal.',
    schedule_type: 'every_x_days', schedule_config: { every_x_days: 3, time: '08:00' },
    posted_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'upd5', node_id: 'n3', author_id: 'u2', author_name: 'Bob Smith', status: 'closed',
    content: 'Sprint planning meeting notes have been posted to Confluence.',
    schedule_type: 'immediate', schedule_config: {},
    posted_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

let subscriptions = [];
let currentUser = null;
let nextId = 100;
const uid = () => `id${++nextId}`;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function mockLogin(email, password) {
  await delay();
  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) throw { response: { data: { error: 'Invalid credentials' } } };
  currentUser = user;
  return { user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at }, token: 'mock-token' };
}

export async function mockRegister(name, email, password) {
  await delay();
  if (users.find(u => u.email === email)) throw { response: { data: { error: 'Email already registered' } } };
  const user = { id: uid(), name, email, password, created_at: new Date().toISOString() };
  users.push(user);
  currentUser = user;
  return { user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at }, token: 'mock-token' };
}

export async function mockGetMe() {
  await delay(100);
  if (!currentUser) throw { response: { status: 401 } };
  return { user: { id: currentUser.id, name: currentUser.name, email: currentUser.email, created_at: currentUser.created_at } };
}

// ─── Nodes ────────────────────────────────────────────────────────────────────
export async function mockGetNodes() {
  await delay();
  const result = nodes
    .filter(n => n.is_public || n.owner_id === currentUser?.id)
    .map(n => ({
      ...n,
      subscriber_count: String(subscriptions.filter(s => s.node_id === n.id && s.is_active).length + parseInt(n.subscriber_count || 0)),
      update_count: String(updates.filter(u => u.node_id === n.id).length),
    }));
  return { nodes: result };
}

export async function mockGetMyNodes() {
  await delay();
  const result = nodes
    .filter(n => n.owner_id === currentUser?.id)
    .map(n => ({
      ...n,
      subscriber_count: String(subscriptions.filter(s => s.node_id === n.id && s.is_active).length),
      update_count: String(updates.filter(u => u.node_id === n.id).length),
    }));
  return { nodes: result };
}

export async function mockGetSubscribedNodes() {
  await delay();
  const mySubs = subscriptions.filter(s => s.user_id === currentUser?.id && s.is_active);
  const result = mySubs.map(s => {
    const n = nodes.find(nd => nd.id === s.node_id);
    return n ? { ...n, channel: s.channel, channel_config: s.channel_config } : null;
  }).filter(Boolean);
  return { nodes: result };
}

export async function mockGetNode(id) {
  await delay();
  const node = nodes.find(n => n.id === id);
  if (!node) throw { response: { data: { error: 'Node not found' } } };
  return { node: { ...node, subscriber_count: String(subscriptions.filter(s => s.node_id === id && s.is_active).length) } };
}

export async function mockCreateNode(data) {
  await delay();
  const node = {
    id: uid(), owner_id: currentUser.id, owner_name: currentUser.name,
    title: data.title, description: data.description || '',
    category: data.category || '', is_public: data.is_public ?? true,
    subscriber_count: '0', update_count: '0', created_at: new Date().toISOString(),
  };
  nodes.push(node);
  return { node };
}

export async function mockUpdateNode(id, data) {
  await delay();
  const idx = nodes.findIndex(n => n.id === id);
  if (idx === -1) throw { response: { data: { error: 'Not found' } } };
  nodes[idx] = { ...nodes[idx], ...data };
  return { node: nodes[idx] };
}

export async function mockDeleteNode(id) {
  await delay();
  nodes = nodes.filter(n => n.id !== id);
  return { message: 'Deleted' };
}

// ─── Updates ──────────────────────────────────────────────────────────────────
export async function mockGetUpdates(nodeId) {
  await delay();
  const result = updates
    .filter(u => u.node_id === nodeId)
    .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
  return { updates: result };
}

export async function mockCreateUpdate(nodeId, payload) {
  await delay();
  const update = {
    id: uid(), node_id: nodeId, author_id: currentUser.id,
    author_name: currentUser.name, status: 'open',
    content: payload.content,
    schedule_type: payload.schedule_type || 'immediate',
    schedule_config: payload.schedule_config || {},
    posted_at: new Date().toISOString(),
  };
  updates.push(update);
  return { update };
}

export async function mockEditUpdate(updateId, payload) {
  await delay();
  const idx = updates.findIndex(u => u.id === updateId);
  if (idx === -1) throw { response: { data: { error: 'Update not found' } } };
  updates[idx] = { ...updates[idx], ...payload };
  return { update: updates[idx] };
}

export async function mockCloseUpdate(updateId) {
  await delay();
  const idx = updates.findIndex(u => u.id === updateId);
  if (idx === -1) throw { response: { data: { error: 'Update not found' } } };
  updates[idx].status = 'closed';
  return { update: updates[idx] };
}

export async function mockReopenUpdate(updateId) {
  await delay();
  const idx = updates.findIndex(u => u.id === updateId);
  if (idx === -1) throw { response: { data: { error: 'Update not found' } } };
  updates[idx].status = 'open';
  return { update: updates[idx] };
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export async function mockGetSubscription(nodeId) {
  await delay();
  const sub = subscriptions.find(s => s.node_id === nodeId && s.user_id === currentUser?.id && s.is_active);
  return { subscription: sub || null };
}

export async function mockSubscribe(nodeId, data) {
  await delay();
  const existing = subscriptions.find(s => s.node_id === nodeId && s.user_id === currentUser.id);
  if (existing) {
    existing.channel = data.channel;
    existing.channel_config = data.channel_config;
    existing.is_active = true;
    return { subscription: existing, updated: true };
  }
  const sub = {
    id: uid(), user_id: currentUser.id, node_id: nodeId,
    channel: data.channel, channel_config: data.channel_config,
    is_active: true, created_at: new Date().toISOString(),
  };
  subscriptions.push(sub);
  return { subscription: sub };
}

export async function mockUnsubscribe(nodeId) {
  await delay();
  const sub = subscriptions.find(s => s.node_id === nodeId && s.user_id === currentUser?.id);
  if (sub) sub.is_active = false;
  return { message: 'Unsubscribed' };
}
