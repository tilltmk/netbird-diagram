import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Server, Router, Cloud, Shield, Database, Globe, Wifi, Lock, Activity } from 'lucide-react';

const NetworkDiagramBuilder = () => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [segments, setSegments] = useState([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const svgRef = useRef(null);

  const nodeTypes = [
    { type: 'server', icon: Server, label: 'Server' },
    { type: 'router', icon: Router, label: 'Router' },
    { type: 'cloud', icon: Cloud, label: 'Cloud' },
    { type: 'database', icon: Database, label: 'Database' },
    { type: 'firewall', icon: Shield, label: 'Firewall' },
    { type: 'monitor', icon: Monitor, label: 'Client' },
    { type: 'internet', icon: Globe, label: 'Internet' },
    { type: 'wifi', icon: Wifi, label: 'WiFi AP' }
  ];

  const createNode = (type, x, y) => {
    const newNode = {
      id: Date.now() + Math.random(),
      type,
      x,
      y,
      label: `${type}-${nodes.length + 1}`,
      metadata: {
        ip: '',
        networks: [],
        services: [],
        interfaces: []
      }
    };
    setNodes([...nodes, newNode]);
    return newNode;
  };

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('nodeType', type);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    createNode(nodeType, x, y);
  };

  const handleNodeMouseDown = (e, node) => {
    if (e.shiftKey) {
      if (connectingFrom) {
        if (connectingFrom.id !== node.id) {
          const newConnection = {
            id: Date.now() + Math.random(),
            from: connectingFrom.id,
            to: node.id,
            label: 'Connection'
          };
          setConnections([...connections, newConnection]);
          setConnectingFrom(null);
        }
      } else {
        setConnectingFrom(node);
      }
    } else {
      setDraggingNode(node);
      setSelectedNode(node);
    }
  };

  const handleMouseMove = (e) => {
    if (draggingNode) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setNodes(nodes.map(n => 
        n.id === draggingNode.id ? { ...n, x, y } : n
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const updateNodeMetadata = (field, value) => {
    if (selectedNode) {
      setNodes(nodes.map(n => 
        n.id === selectedNode.id 
          ? { ...n, metadata: { ...n.metadata, [field]: value } }
          : n
      ));
    }
  };

  const updateConnectionLabel = (label) => {
    if (selectedConnection) {
      setConnections(connections.map(c =>
        c.id === selectedConnection.id ? { ...c, label } : c
      ));
    }
  };

  const createSegment = () => {
    const newSegment = {
      id: Date.now() + Math.random(),
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      label: `Segment ${segments.length + 1}`,
      color: '#FF6B35'
    };
    setSegments([...segments, newSegment]);
  };

  const processBulkImport = () => {
    try {
      const lines = bulkImportText.trim().split('\n');
      let y = 100;
      const nodeMap = {};
      
      lines.forEach(line => {
        if (line.includes('->')) {
          const [from, to] = line.split('->').map(s => s.trim());
          
          if (!nodeMap[from]) {
            nodeMap[from] = createNode('server', 100, y);
            y += 100;
          }
          
          if (!nodeMap[to]) {
            nodeMap[to] = createNode('server', 300, y);
            y += 100;
          }
          
          const newConnection = {
            id: Date.now() + Math.random(),
            from: nodeMap[from].id,
            to: nodeMap[to].id,
            label: 'Connection'
          };
          setConnections(prev => [...prev, newConnection]);
        }
      });
      
      setShowBulkImport(false);
      setBulkImportText('');
    } catch (error) {
      alert('Fehler beim Import. Bitte Format überprüfen');
    }
  };

  const NodeIcon = ({ type, x, y, selected, connecting }) => {
    const Icon = nodeTypes.find(t => t.type === type)?.icon || Server;
    return (
      <g>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect
          x={x - 35}
          y={y - 35}
          width="70"
          height="70"
          rx="10"
          className={`node-rect ${selected ? 'selected' : ''} ${connecting ? 'connecting' : ''}`}
        />
        <Icon 
          x={x - 20} 
          y={y - 20} 
          size={40} 
          className="node-icon"
        />
      </g>
    );
  };

  return (
    <div className="app-container">
      <style jsx>{`
        .app-container {
          width: 100vw;
          height: 100vh;
          background: #0a0a0a;
          color: #fff;
          display: flex;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .sidebar {
          width: 280px;
          background: rgba(20, 20, 20, 0.8);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 107, 53, 0.2);
          padding: 20px;
          overflow-y: auto;
        }
        
        .main-area {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        .node-palette {
          margin-bottom: 30px;
        }
        
        .node-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          margin-bottom: 8px;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 8px;
          cursor: grab;
          transition: all 0.3s ease;
        }
        
        .node-item:hover {
          background: rgba(255, 107, 53, 0.2);
          border-color: #FF6B35;
          box-shadow: 0 0 20px rgba(255, 107, 53, 0.4);
        }
        
        .node-item:active {
          cursor: grabbing;
        }
        
        .properties-panel {
          background: rgba(30, 30, 30, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .properties-panel h3 {
          color: #FF6B35;
          margin-bottom: 15px;
          font-size: 16px;
        }
        
        .property-field {
          margin-bottom: 15px;
        }
        
        .property-field label {
          display: block;
          color: #999;
          font-size: 12px;
          margin-bottom: 5px;
        }
        
        .property-field input,
        .property-field textarea {
          width: 100%;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .property-field input:focus,
        .property-field textarea:focus {
          outline: none;
          border-color: #FF6B35;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
        }
        
        .toolbar {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 10;
        }
        
        .btn {
          padding: 10px 20px;
          background: rgba(255, 107, 53, 0.2);
          border: 1px solid #FF6B35;
          border-radius: 8px;
          color: #FF6B35;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }
        
        .btn:hover {
          background: rgba(255, 107, 53, 0.3);
          box-shadow: 0 0 20px rgba(255, 107, 53, 0.4);
        }
        
        .diagram-svg {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 50% 50%, rgba(255, 107, 53, 0.05), transparent 70%);
        }
        
        .node-rect {
          fill: rgba(20, 20, 20, 0.8);
          stroke: rgba(255, 107, 53, 0.5);
          stroke-width: 2;
          filter: url(#glow);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .node-rect:hover {
          stroke: #FF6B35;
          stroke-width: 3;
          fill: rgba(255, 107, 53, 0.1);
        }
        
        .node-rect.selected {
          stroke: #FF6B35;
          stroke-width: 3;
          fill: rgba(255, 107, 53, 0.2);
        }
        
        .node-rect.connecting {
          stroke: #FFD93D;
          stroke-width: 3;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .node-icon {
          fill: #FF6B35;
          filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.5));
        }
        
        .connection-line {
          stroke: rgba(255, 107, 53, 0.6);
          stroke-width: 2;
          fill: none;
          filter: drop-shadow(0 0 5px rgba(255, 107, 53, 0.5));
          cursor: pointer;
        }
        
        .connection-line:hover {
          stroke: #FF6B35;
          stroke-width: 3;
        }
        
        .connection-label {
          fill: #FF6B35;
          font-size: 12px;
          text-anchor: middle;
          filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8));
        }
        
        .segment-rect {
          fill: none;
          stroke: rgba(255, 107, 53, 0.3);
          stroke-width: 2;
          stroke-dasharray: 5,5;
          rx: 10;
        }
        
        .segment-label {
          fill: rgba(255, 107, 53, 0.8);
          font-size: 14px;
          font-weight: 600;
        }
        
        .modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(20, 20, 20, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 12px;
          padding: 30px;
          min-width: 500px;
          z-index: 100;
          box-shadow: 0 0 50px rgba(255, 107, 53, 0.3);
        }
        
        .modal h2 {
          color: #FF6B35;
          margin-bottom: 20px;
        }
        
        .modal textarea {
          width: 100%;
          min-height: 200px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 8px;
          color: #fff;
          font-family: monospace;
          font-size: 14px;
          resize: vertical;
        }
        
        .modal-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          justify-content: flex-end;
        }
        
        .help-text {
          color: #999;
          font-size: 12px;
          margin-top: 20px;
          line-height: 1.5;
        }
        
        .info-text {
          color: #666;
          font-size: 11px;
          margin-top: 10px;
          padding: 10px;
          background: rgba(255, 107, 53, 0.05);
          border-radius: 6px;
          border: 1px solid rgba(255, 107, 53, 0.1);
        }
      `}</style>
      
      <div className="sidebar">
        <h2 style={{ color: '#FF6B35', marginBottom: '20px' }}>Network Components</h2>
        
        <div className="node-palette">
          {nodeTypes.map(({ type, icon: Icon, label }) => (
            <div
              key={type}
              className="node-item"
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
            >
              <Icon size={24} color="#FF6B35" />
              <span>{label}</span>
            </div>
          ))}
        </div>
        
        {selectedNode && (
          <div className="properties-panel">
            <h3>Node Properties</h3>
            <div className="property-field">
              <label>Label</label>
              <input
                value={selectedNode.label}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  setNodes(nodes.map(n => 
                    n.id === selectedNode.id ? { ...n, label: newLabel } : n
                  ));
                  setSelectedNode({ ...selectedNode, label: newLabel });
                }}
              />
            </div>
            <div className="property-field">
              <label>IP Address</label>
              <input
                value={selectedNode.metadata.ip}
                onChange={(e) => updateNodeMetadata('ip', e.target.value)}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="property-field">
              <label>Networks</label>
              <textarea
                value={selectedNode.metadata.networks.join('\n')}
                onChange={(e) => updateNodeMetadata('networks', e.target.value.split('\n').filter(n => n))}
                placeholder="VLAN10&#10;DMZ&#10;Internal"
                rows="3"
              />
            </div>
            <div className="property-field">
              <label>Services</label>
              <textarea
                value={selectedNode.metadata.services.join('\n')}
                onChange={(e) => updateNodeMetadata('services', e.target.value.split('\n').filter(s => s))}
                placeholder="HTTP:80&#10;SSH:22&#10;HTTPS:443"
                rows="3"
              />
            </div>
          </div>
        )}
        
        {selectedConnection && (
          <div className="properties-panel">
            <h3>Connection Properties</h3>
            <div className="property-field">
              <label>Label</label>
              <input
                value={selectedConnection.label}
                onChange={(e) => updateConnectionLabel(e.target.value)}
                placeholder="Connection Label"
              />
            </div>
          </div>
        )}
        
        <div className="info-text">
          <strong>Tipps:</strong><br/>
          • Komponenten per Drag & Drop platzieren<br/>
          • Shift + Klick für Verbindungen<br/>
          • Nodes zum Verschieben ziehen
        </div>
      </div>
      
      <div className="main-area">
        <div className="toolbar">
          <button className="btn" onClick={createSegment}>
            Segment hinzufügen
          </button>
          <button className="btn" onClick={() => setShowBulkImport(true)}>
            Bulk Import
          </button>
          <button className="btn" onClick={() => {
            setNodes([]);
            setConnections([]);
            setSegments([]);
          }}>
            Clear
          </button>
        </div>
        
        <svg
          ref={svgRef}
          className="diagram-svg"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => {
            setSelectedNode(null);
            setSelectedConnection(null);
            setConnectingFrom(null);
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#FF6B35"
              />
            </marker>
          </defs>
          
          {segments.map(segment => (
            <g key={segment.id}>
              <rect
                x={segment.x}
                y={segment.y}
                width={segment.width}
                height={segment.height}
                className="segment-rect"
              />
              <text
                x={segment.x + 10}
                y={segment.y + 25}
                className="segment-label"
              >
                {segment.label}
              </text>
            </g>
          ))}
          
          {connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            
            return (
              <g key={conn.id}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  className="connection-line"
                  markerEnd="url(#arrowhead)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConnection(conn);
                    setSelectedNode(null);
                  }}
                />
                <text
                  x={midX}
                  y={midY - 5}
                  className="connection-label"
                >
                  {conn.label}
                </text>
              </g>
            );
          })}
          
          {nodes.map(node => (
            <g
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              style={{ cursor: draggingNode?.id === node.id ? 'grabbing' : 'grab' }}
            >
              <NodeIcon
                type={node.type}
                x={node.x}
                y={node.y}
                selected={selectedNode?.id === node.id}
                connecting={connectingFrom?.id === node.id}
              />
              <text
                x={node.x}
                y={node.y + 50}
                textAnchor="middle"
                fill="#fff"
                fontSize="14"
                style={{ userSelect: 'none' }}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
        
        {showBulkImport && (
          <div className="modal">
            <h2>Bulk Import</h2>
            <p style={{ color: '#999', marginBottom: '15px' }}>
              Format: Nutze "Node1 -> Node2" für Verbindungen
            </p>
            <textarea
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder="Server1 -> Router1&#10;Router1 -> Firewall1&#10;Firewall1 -> Internet"
            />
            <div className="modal-buttons">
              <button className="btn" onClick={() => setShowBulkImport(false)}>
                Abbrechen
              </button>
              <button className="btn" onClick={processBulkImport}>
                Importieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkDiagramBuilder;
