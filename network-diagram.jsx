import React, { useState, useRef } from 'react';
import { Monitor, Server, Router, Cloud, Shield, Database, Globe, Wifi, Network, Download } from 'lucide-react';

const NetworkDiagramBuilder = () => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [resizingSegment, setResizingSegment] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const svgRef = useRef(null);

  const nodeTypes = [
    { type: 'server', icon: Server, label: 'Server' },
    { type: 'router', icon: Router, label: 'Router' },
    { type: 'switch', icon: Network, label: 'LAN Switch' },
    { type: 'cloud', icon: Cloud, label: 'Cloud' },
    { type: 'database', icon: Database, label: 'Database' },
    { type: 'firewall', icon: Shield, label: 'Firewall' },
    { type: 'monitor', icon: Monitor, label: 'Client' },
    { type: 'internet', icon: Globe, label: 'Internet' },
    { type: 'wifi', icon: Wifi, label: 'WiFi AP' }
  ];

  const createNode = (type, x, y, label = null) => {
    const newNode = {
      id: Date.now() + Math.random(),
      type,
      x,
      y,
      label: label || `${type}-${nodes.length + 1}`,
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
      setSelectedConnection(null);
      setSelectedSegment(null);
    }
  };

  const handleMouseMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (draggingNode) {
      setNodes(nodes.map(n => 
        n.id === draggingNode.id ? { ...n, x, y } : n
      ));
    }
    
    if (resizingSegment && resizeHandle) {
      const segment = segments.find(s => s.id === resizingSegment);
      if (segment) {
        let updates = {};
        
        switch(resizeHandle) {
          case 'nw':
            updates = {
              x: Math.min(x, segment.x + segment.width - 50),
              y: Math.min(y, segment.y + segment.height - 50),
              width: segment.width + (segment.x - x),
              height: segment.height + (segment.y - y)
            };
            break;
          case 'ne':
            updates = {
              y: Math.min(y, segment.y + segment.height - 50),
              width: Math.max(50, x - segment.x),
              height: segment.height + (segment.y - y)
            };
            break;
          case 'sw':
            updates = {
              x: Math.min(x, segment.x + segment.width - 50),
              width: segment.width + (segment.x - x),
              height: Math.max(50, y - segment.y)
            };
            break;
          case 'se':
            updates = {
              width: Math.max(50, x - segment.x),
              height: Math.max(50, y - segment.y)
            };
            break;
        }
        
        setSegments(segments.map(s =>
          s.id === resizingSegment ? { ...s, ...updates } : s
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setResizingSegment(null);
    setResizeHandle(null);
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

  const handleResizeStart = (e, segmentId, handle) => {
    e.stopPropagation();
    setResizingSegment(segmentId);
    setResizeHandle(handle);
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
            nodeMap[from] = createNode('server', 100, y, from);
            y += 100;
          }
          
          if (!nodeMap[to]) {
            nodeMap[to] = createNode('server', 300, y, to);
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

  const exportSVG = () => {
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    // Erstelle vollständiges SVG mit allen Styles
    const fullSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <style>
    .node-rect { fill: rgba(20, 20, 20, 0.8); stroke: rgba(255, 107, 53, 0.5); stroke-width: 2; }
    .node-rect.selected { stroke: #FF6B35; stroke-width: 3; fill: rgba(255, 107, 53, 0.2); }
    .node-icon { fill: #FF6B35; }
    .connection-line { stroke: rgba(255, 107, 53, 0.6); stroke-width: 2; fill: none; }
    .connection-line.selected { stroke: #FFD93D; stroke-width: 3; }
    .connection-label { fill: #FF6B35; font-size: 12px; text-anchor: middle; }
    .segment-rect { fill: none; stroke: rgba(255, 107, 53, 0.3); stroke-width: 2; stroke-dasharray: 5,5; rx: 10; }
    .segment-label { fill: rgba(255, 107, 53, 0.8); font-size: 14px; font-weight: 600; }
    .node-label { fill: #fff; font-size: 14px; text-anchor: middle; }
    .node-ip { fill: #999; font-size: 11px; text-anchor: middle; }
  </style>
  ${svgData}
</svg>`;
    
    const blob = new Blob([fullSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'network-diagram.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const NodeIcon = ({ type, x, y, selected, connecting }) => {
    const Icon = nodeTypes.find(t => t.type === type)?.icon || Server;
    const iconSize = 40;
    const rectSize = 70;
    
    return (
      <g>
        <rect
          x={x - rectSize/2}
          y={y - rectSize/2}
          width={rectSize}
          height={rectSize}
          rx="10"
          className={`node-rect ${selected ? 'selected' : ''} ${connecting ? 'connecting' : ''}`}
        />
        <g transform={`translate(${x - iconSize/2}, ${y - iconSize/2})`}>
          <Icon size={iconSize} className="node-icon" />
        </g>
      </g>
    );
  };

  const styles = `
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
      display: flex;
      align-items: center;
      gap: 8px;
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
    }
    
    .node-label {
      fill: #fff;
      font-size: 14px;
      text-anchor: middle;
      user-select: none;
    }
    
    .node-ip {
      fill: #999;
      font-size: 11px;
      text-anchor: middle;
      user-select: none;
    }
    
    .connection-line {
      stroke: rgba(255, 107, 53, 0.6);
      stroke-width: 2;
      fill: none;
      cursor: pointer;
    }
    
    .connection-line:hover {
      stroke: #FF6B35;
      stroke-width: 3;
    }
    
    .connection-line.selected {
      stroke: #FFD93D;
      stroke-width: 3;
    }
    
    .connection-label {
      fill: #FF6B35;
      font-size: 12px;
      text-anchor: middle;
      cursor: pointer;
    }
    
    .connection-label.selected {
      fill: #FFD93D;
      font-weight: bold;
    }
    
    .segment-rect {
      fill: none;
      stroke: rgba(255, 107, 53, 0.3);
      stroke-width: 2;
      stroke-dasharray: 5,5;
      rx: 10;
      cursor: pointer;
    }
    
    .segment-rect.selected {
      stroke: #FF6B35;
      stroke-width: 2;
      stroke-dasharray: none;
    }
    
    .segment-label {
      fill: rgba(255, 107, 53, 0.8);
      font-size: 14px;
      font-weight: 600;
    }
    
    .resize-handle {
      fill: #FF6B35;
      stroke: #fff;
      stroke-width: 1;
      cursor: nwse-resize;
      transition: all 0.3s ease;
    }
    
    .resize-handle:hover {
      fill: #fff;
      stroke: #FF6B35;
      transform: scale(1.2);
    }
    
    .resize-handle.ne,
    .resize-handle.sw {
      cursor: nesw-resize;
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
  `;

  return (
    <div className="app-container">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
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
                value={nodes.find(n => n.id === selectedNode.id)?.label || ''}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  setNodes(nodes.map(n => 
                    n.id === selectedNode.id ? { ...n, label: newLabel } : n
                  ));
                }}
              />
            </div>
            <div className="property-field">
              <label>IP Address</label>
              <input
                value={nodes.find(n => n.id === selectedNode.id)?.metadata.ip || ''}
                onChange={(e) => updateNodeMetadata('ip', e.target.value)}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="property-field">
              <label>Networks</label>
              <textarea
                value={nodes.find(n => n.id === selectedNode.id)?.metadata.networks.join('\n') || ''}
                onChange={(e) => {
                  const networks = e.target.value.split('\n');
                  updateNodeMetadata('networks', networks);
                }}
                placeholder="VLAN10&#10;DMZ&#10;Internal"
                rows="3"
              />
            </div>
            <div className="property-field">
              <label>Services</label>
              <textarea
                value={nodes.find(n => n.id === selectedNode.id)?.metadata.services.join('\n') || ''}
                onChange={(e) => {
                  const services = e.target.value.split('\n');
                  updateNodeMetadata('services', services);
                }}
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
                value={connections.find(c => c.id === selectedConnection.id)?.label || ''}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  setConnections(connections.map(c =>
                    c.id === selectedConnection.id ? { ...c, label: newLabel } : c
                  ));
                }}
                placeholder="Connection Label"
              />
            </div>
          </div>
        )}
        
        {selectedSegment && (
          <div className="properties-panel">
            <h3>Segment Properties</h3>
            <div className="property-field">
              <label>Label</label>
              <input
                value={segments.find(s => s.id === selectedSegment.id)?.label || ''}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  setSegments(segments.map(s => 
                    s.id === selectedSegment.id ? { ...s, label: newLabel } : s
                  ));
                }}
              />
            </div>
          </div>
        )}
        
        <div className="info-text">
          <strong>Tipps:</strong><br/>
          • Komponenten per Drag & Drop platzieren<br/>
          • Shift + Klick für Verbindungen<br/>
          • Nodes zum Verschieben ziehen<br/>
          • Segmente an den Ecken resizen<br/>
          • Klick auf Elemente zum Editieren<br/>
          • IP-Adressen werden angezeigt
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
          <button className="btn" onClick={exportSVG}>
            <Download size={16} />
            SVG Export
          </button>
          <button className="btn" onClick={() => {
            setNodes([]);
            setConnections([]);
            setSegments([]);
            setSelectedNode(null);
            setSelectedConnection(null);
            setSelectedSegment(null);
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
            setSelectedSegment(null);
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
            <g key={segment.id} className="segment-group">
              <rect
                x={segment.x}
                y={segment.y}
                width={segment.width}
                height={segment.height}
                className={`segment-rect ${selectedSegment?.id === segment.id ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSegment(segment);
                  setSelectedNode(null);
                  setSelectedConnection(null);
                }}
              />
              <text
                x={segment.x + 10}
                y={segment.y + 25}
                className="segment-label"
              >
                {segment.label}
              </text>
              
              {selectedSegment?.id === segment.id && (
                <>
                  <rect
                    x={segment.x - 5}
                    y={segment.y - 5}
                    width="10"
                    height="10"
                    className="resize-handle nw"
                    onMouseDown={(e) => handleResizeStart(e, segment.id, 'nw')}
                  />
                  <rect
                    x={segment.x + segment.width - 5}
                    y={segment.y - 5}
                    width="10"
                    height="10"
                    className="resize-handle ne"
                    onMouseDown={(e) => handleResizeStart(e, segment.id, 'ne')}
                  />
                  <rect
                    x={segment.x - 5}
                    y={segment.y + segment.height - 5}
                    width="10"
                    height="10"
                    className="resize-handle sw"
                    onMouseDown={(e) => handleResizeStart(e, segment.id, 'sw')}
                  />
                  <rect
                    x={segment.x + segment.width - 5}
                    y={segment.y + segment.height - 5}
                    width="10"
                    height="10"
                    className="resize-handle se"
                    onMouseDown={(e) => handleResizeStart(e, segment.id, 'se')}
                  />
                </>
              )}
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
                  className={`connection-line ${selectedConnection?.id === conn.id ? 'selected' : ''}`}
                  markerEnd="url(#arrowhead)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConnection(conn);
                    setSelectedNode(null);
                    setSelectedSegment(null);
                  }}
                />
                <text
                  x={midX}
                  y={midY - 5}
                  className={`connection-label ${selectedConnection?.id === conn.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConnection(conn);
                    setSelectedNode(null);
                    setSelectedSegment(null);
                  }}
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
                className="node-label"
              >
                {node.label}
              </text>
              {node.metadata.ip && (
                <text
                  x={node.x}
                  y={node.y + 65}
                  className="node-ip"
                >
                  {node.metadata.ip}
                </text>
              )}
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
