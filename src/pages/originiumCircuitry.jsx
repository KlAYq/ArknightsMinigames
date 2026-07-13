import React, { useState, useEffect, useRef } from "react";
import "./originiumCircuitry.css";
import Confetti from "../components/Confetti";
// Helper to rotate a 2D matrix clockwise
const rotateMatrix = (matrix) => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return result;
};

// Available base shapes
const BASE_SHAPES = [
  { name: "Dot", shape: [[1]] },
  { name: "Domino", shape: [[1, 1]] },
  { name: "Tromino-I", shape: [[1, 1, 1]] },
  { name: "Tromino-L", shape: [[1, 0], [1, 1]] },
  { name: "Tetromino-O", shape: [[1, 1], [1, 1]] },
  { name: "Tetromino-T", shape: [[1, 1, 1], [0, 1, 0]] },
  { name: "Tetromino-L", shape: [[1, 0], [1, 0], [1, 1]] },
  { name: "Tetromino-Z", shape: [[1, 1, 0], [0, 1, 1]] },
];

// Reusable Piece SVG component that draws a contiguous outline around the shape
const PieceSVG = ({ shape, cellSize, color, opacity = 1, rotation = 0, onClick, onTouchStart }) => {
  const pRows = shape.length;
  const pCols = shape[0].length;
  const width = pCols * cellSize;
  const height = pRows * cellSize;

  // Generate outer boundary line segments
  const lines = [];
  for (let r = 0; r < pRows; r++) {
    for (let c = 0; c < pCols; c++) {
      if (shape[r][c] === 1) {
        const x1 = c * cellSize;
        const x2 = (c + 1) * cellSize;
        const y1 = r * cellSize;
        const y2 = (r + 1) * cellSize;

        // Top edge
        if (r === 0 || shape[r - 1][c] === 0) {
          lines.push({ x1, y1, x2, y2: y1 });
        }
        // Bottom edge
        if (r === pRows - 1 || shape[r + 1][c] === 0) {
          lines.push({ x1, y1: y2, x2, y2 });
        }
        // Left edge
        if (c === 0 || shape[r][c - 1] === 0) {
          lines.push({ x1, y1, x2: x1, y2 });
        }
        // Right edge
        if (c === pCols - 1 || shape[r][c + 1] === 0) {
          lines.push({ x1: x2, y1, x2, y2 });
        }
      }
    }
  }

  return (
    <div
      className="piece-svg-container"
      style={{
        display: "inline-block",
        opacity,
        transform: `rotate(${rotation}deg)`,
        transition: "transform 0.22s cubic-bezier(0.25, 0.8, 0.25, 1)",
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    >
      <svg width={width} height={height} style={{ display: "block", pointerEvents: "none" }}>
        {/* 1. Filled cells */}
        {shape.map((row, r) =>
          row.map((cell, c) => {
            if (cell === 0) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={color}
                stroke="none"
                onClick={onClick}
                onTouchStart={onTouchStart}
                style={{ pointerEvents: "auto", cursor: (onClick || onTouchStart) ? "pointer" : "default" }}
              />
            );
          })
        )}

        {/* Inner thick black border */}
        {lines.map((line, i) => (
          <line
            key={`black-outer-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#000000ff"
            strokeWidth={6}
            strokeLinecap="square"
          />
        ))}

        {/* Outer green highlight stripe */}
        {lines.map((line, i) => (
          <line
            key={`green-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="square"
          />
        ))}
      </svg>
    </div>
  );
};

function OriginiumCircuitry() {
  const [gridSize, setGridSize] = useState({ rows: 5, cols: 5 });
  const [rowTargets, setRowTargets] = useState([]);
  const [colTargets, setColTargets] = useState([]);
  const [placedPieces, setPlacedPieces] = useState([]); // { id, shape, r, c, color, originalShape, rotation }
  const [inventory, setInventory] = useState([]); // { id, shape, color, originalShape }

  // Dragging/holding state
  const [draggedPiece, setDraggedPiece] = useState(null); // { id, shape, color, source, originalPos, originalShape, visualRotation }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoverGridPos, setHoverGridPos] = useState(null); // { r, c }

  // Game state
  const [isSolved, setIsSolved] = useState(false);
  const [triggerSolvedAnimation, setTriggerSolvedAnimation] = useState(false);
  const [showVictoryControls, setShowVictoryControls] = useState(false);

  const gridRef = useRef(null);

  useEffect(() => {
    startNewGame();
  }, [gridSize]);

  // Handle global mouse move & click-to-place logic (Desktop)
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      if (!draggedPiece || !gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const cellSize = rect.width / gridSize.cols;

      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      // Cursor grid coordinate
      const cursorR = Math.floor(relativeY / cellSize);
      const cursorC = Math.floor(relativeX / cellSize);

      // Centered top-left of the piece relative to grid
      const r = cursorR - Math.floor(draggedPiece.shape.length / 2);
      const c = cursorC - Math.floor(draggedPiece.shape[0].length / 2);

      setHoverGridPos({ r, c });
    };

    const handleGlobalClick = () => {
      if (!draggedPiece) return;

      if (hoverGridPos && gridRef.current) {
        const { r, c } = hoverGridPos;
        if (canPlacePiece(draggedPiece.shape, r, c, draggedPiece.id)) {
          // Place it
          const newPlaced = [
            ...placedPieces.filter(p => p.id !== draggedPiece.id),
            {
              id: draggedPiece.id,
              shape: draggedPiece.shape,
              r,
              c,
              color: draggedPiece.color,
              originalShape: draggedPiece.originalShape,
              rotation: draggedPiece.visualRotation
            }
          ];
          setPlacedPieces(newPlaced);
        } else {
          // Invalid click on grid -> return to inventory with original shape
          returnToInventoryWithOriginalShape(draggedPiece);
        }
      } else {
        // Clicked outside grid -> return to inventory with original shape
        returnToInventoryWithOriginalShape(draggedPiece);
      }

      setDraggedPiece(null);
      setHoverGridPos(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === "r" || e.key === "R") {
        rotateDraggedPiece();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draggedPiece, hoverGridPos, placedPieces, gridSize]);

  // Handle global touch events (Mobile compatibility)
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (!draggedPiece) return;
      // If a second finger touches the screen while dragging, rotate!
      if (e.touches.length === 2) {
        e.preventDefault();
        rotateDraggedPiece();
      }
    };

    const handleTouchMove = (e) => {
      if (!draggedPiece || !gridRef.current) return;
      // Prevent browser scroll/move/refresh while dragging
      e.preventDefault();

      const touch = e.touches[0];
      setMousePos({ x: touch.clientX, y: touch.clientY });

      const rect = gridRef.current.getBoundingClientRect();
      const cellSize = rect.width / gridSize.cols;

      const relativeX = touch.clientX - rect.left;
      const relativeY = touch.clientY - rect.top;

      const cursorR = Math.floor(relativeY / cellSize);
      const cursorC = Math.floor(relativeX / cellSize);

      const r = cursorR - Math.floor(draggedPiece.shape.length / 2);
      const c = cursorC - Math.floor(draggedPiece.shape[0].length / 2);

      setHoverGridPos({ r, c });
    };

    const handleTouchEnd = (e) => {
      if (!draggedPiece) return;

      // When the dragging finger is released
      if (e.touches.length === 0) {
        if (hoverGridPos && gridRef.current) {
          const { r, c } = hoverGridPos;
          if (canPlacePiece(draggedPiece.shape, r, c, draggedPiece.id)) {
            const newPlaced = [
              ...placedPieces.filter(p => p.id !== draggedPiece.id),
              {
                id: draggedPiece.id,
                shape: draggedPiece.shape,
                r,
                c,
                color: draggedPiece.color,
                originalShape: draggedPiece.originalShape,
                rotation: draggedPiece.visualRotation
              }
            ];
            setPlacedPieces(newPlaced);
          } else {
            returnToInventoryWithOriginalShape(draggedPiece);
          }
        } else {
          returnToInventoryWithOriginalShape(draggedPiece);
        }

        setDraggedPiece(null);
        setHoverGridPos(null);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [draggedPiece, hoverGridPos, placedPieces, gridSize]);

  // Solve detection
  useEffect(() => {
    if (rowTargets.length === 0 || colTargets.length === 0 || isSolved) return;

    const activeGrid = Array.from({ length: gridSize.rows }, () => Array(gridSize.cols).fill(0));
    placedPieces.forEach(p => {
      p.shape.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell === 1) {
            const targetR = p.r + ri;
            const targetC = p.c + ci;
            if (targetR >= 0 && targetR < gridSize.rows && targetC >= 0 && targetC < gridSize.cols) {
              activeGrid[targetR][targetC] = 1;
            }
          }
        });
      });
    });

    // Check rows
    const rowSums = activeGrid.map(row => row.reduce((sum, val) => sum + val, 0));
    const rowsMatch = rowSums.every((sum, i) => sum === rowTargets[i]);

    // Check cols
    const colSums = Array(gridSize.cols).fill(0);
    for (let c = 0; c < gridSize.cols; c++) {
      for (let r = 0; r < gridSize.rows; r++) {
        colSums[c] += activeGrid[r][c];
      }
    }
    const colsMatch = colSums.every((sum, i) => sum === colTargets[i]);

    if (rowsMatch && colsMatch) {
      setIsSolved(true);
      setTriggerSolvedAnimation(true);

      setTimeout(() => {
        setTriggerSolvedAnimation(false);
        setShowVictoryControls(true);
      }, 1300);
    }
  }, [placedPieces, rowTargets, colTargets, gridSize, isSolved]);

  const returnToInventoryWithOriginalShape = (piece) => {
    setPlacedPieces(prev => prev.filter(p => p.id !== piece.id));
    setInventory(prev =>
      prev.map(item => item.id === piece.id ? { ...item, shape: piece.originalShape } : item)
    );
  };

  const startNewGame = () => {
    setIsSolved(false);
    setTriggerSolvedAnimation(false);
    setShowVictoryControls(false);
    setPlacedPieces([]);

    // Generate puzzle solver
    const rows = gridSize.rows;
    const cols = gridSize.cols;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    const placed = [];

    // Random 3 to 5 pieces on a 5x5 grid
    const numPieces = 3 + Math.floor(Math.random() * 3);
    let attempts = 0;

    while (placed.length < numPieces && attempts < 150) {
      attempts++;
      const basePiece = BASE_SHAPES[Math.floor(Math.random() * BASE_SHAPES.length)];
      let shape = basePiece.shape;

      // Random rotation
      const rots = Math.floor(Math.random() * 4);
      for (let r = 0; r < rots; r++) {
        shape = rotateMatrix(shape);
      }

      const pRows = shape.length;
      const pCols = shape[0].length;
      const maxR = rows - pRows;
      const maxC = cols - pCols;

      if (maxR < 0 || maxC < 0) continue;

      const r = Math.floor(Math.random() * (maxR + 1));
      const c = Math.floor(Math.random() * (maxC + 1));

      // Overlap check
      let overlaps = false;
      for (let pr = 0; pr < pRows; pr++) {
        for (let pc = 0; pc < pCols; pc++) {
          if (shape[pr][pc] === 1 && grid[r + pr][c + pc] === 1) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) break;
      }

      if (!overlaps) {
        // Place on mock grid
        for (let pr = 0; pr < pRows; pr++) {
          for (let pc = 0; pc < pCols; pc++) {
            if (shape[pr][pc] === 1) {
              grid[r + pr][c + pc] = 1;
            }
          }
        }
        placed.push({
          id: `piece_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          shape,
          r,
          c,
          color: "#8FC000",
          originalShape: shape,
          rotation: 0
        });
      }
    }

    // Set target numbers
    const newRowTargets = grid.map(row => row.reduce((sum, v) => sum + v, 0));
    const newColTargets = Array(cols).fill(0);
    for (let c = 0; c < cols; c++) {
      let sum = 0;
      for (let r = 0; r < rows; r++) {
        sum += grid[r][c];
      }
      newColTargets[c] = sum;
    }

    setRowTargets(newRowTargets);
    setColTargets(newColTargets);

    // Set inventory list
    const finalInventory = placed.map(p => ({
      id: p.id,
      shape: p.shape,
      color: p.color,
      originalShape: p.shape // Keep track of default starting rotation for when return to inventory
    })).sort(() => Math.random() - 0.5);

    setInventory(finalInventory);
  };

  const rotateDraggedPiece = () => {
    if (!draggedPiece) return;
    const rotated = rotateMatrix(draggedPiece.shape);
    setDraggedPiece(prev => ({
      ...prev,
      visualRotation: prev.visualRotation + 90,
      shape: rotated
    }));

    // Also update rotation in inventory preview
    setInventory(prev => prev.map(item => item.id === draggedPiece.id ? { ...item, shape: rotated } : item));
  };

  const canPlacePiece = (shape, targetR, targetC, ignoreId) => {
    const sRows = shape.length;
    const sCols = shape[0].length;

    for (let r = 0; r < sRows; r++) {
      for (let c = 0; c < sCols; c++) {
        if (shape[r][c] === 1) {
          const gridR = targetR + r;
          const gridC = targetC + c;

          // Check boundaries
          if (gridR < 0 || gridR >= gridSize.rows || gridC < 0 || gridC >= gridSize.cols) {
            return false;
          }

          // Check overlap with other placed pieces
          const overlapping = placedPieces.some(p => {
            if (p.id === ignoreId) return false;
            const relativeR = gridR - p.r;
            const relativeC = gridC - p.c;
            if (relativeR >= 0 && relativeR < p.shape.length && relativeC >= 0 && relativeC < p.shape[0].length) {
              return p.shape[relativeR][relativeC] === 1;
            }
            return false;
          });

          if (overlapping) return false;
        }
      }
    }
    return true;
  };

  // Click handler to pick up piece from sidebar
  const handleInventoryPieceClick = (e, piece) => {
    if (isSolved || draggedPiece) return;

    // Check if it is already placed or dragging
    const isPlaced = placedPieces.some(p => p.id === piece.id);
    const isDragging = draggedPiece?.id === piece.id;
    if (isPlaced || isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    setDraggedPiece({
      id: piece.id,
      shape: piece.shape,
      color: piece.color,
      source: "inventory",
      originalShape: piece.originalShape,
      visualRotation: 0
    });
  };

  // Touch pick up handler from sidebar (Mobile)
  const handleInventoryPieceTouchStart = (e, piece) => {
    if (isSolved || draggedPiece) return;

    const isPlaced = placedPieces.some(p => p.id === piece.id);
    const isDragging = draggedPiece?.id === piece.id;
    if (isPlaced || isDragging) return;

    e.stopPropagation();
    const touch = e.touches[0];

    setDraggedPiece({
      id: piece.id,
      shape: piece.shape,
      color: piece.color,
      source: "inventory",
      originalShape: piece.originalShape,
      visualRotation: 0
    });

    setMousePos({ x: touch.clientX, y: touch.clientY });
  };

  // Click handler to pick up already placed piece from grid
  const handlePlacedPieceClick = (e, piece) => {
    if (isSolved || draggedPiece) return;

    e.preventDefault();
    e.stopPropagation();

    setDraggedPiece({
      id: piece.id,
      shape: piece.shape,
      color: piece.color,
      source: "grid",
      originalPos: { r: piece.r, c: piece.c },
      originalShape: piece.originalShape,
      visualRotation: piece.rotation || 0
    });
  };

  // Touch pick up handler from grid (Mobile)
  const handlePlacedPieceTouchStart = (e, piece) => {
    if (isSolved || draggedPiece) return;

    e.stopPropagation();
    const touch = e.touches[0];

    setDraggedPiece({
      id: piece.id,
      shape: piece.shape,
      color: piece.color,
      source: "grid",
      originalPos: { r: piece.r, c: piece.c },
      originalShape: piece.originalShape,
      visualRotation: piece.rotation || 0
    });

    setMousePos({ x: touch.clientX, y: touch.clientY });
  };

  // Handle right-click on floating piece to rotate (Desktop)
  const handleContextMenu = (e) => {
    e.preventDefault();
    rotateDraggedPiece();
  };

  // Calculate actual row and column sums for checking/satisfying labels
  const getGridSums = () => {
    const activeGrid = Array.from({ length: gridSize.rows }, () => Array(gridSize.cols).fill(0));
    placedPieces.forEach(p => {
      p.shape.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell === 1) {
            const targetR = p.r + ri;
            const targetC = p.c + ci;
            if (targetR >= 0 && targetR < gridSize.rows && targetC >= 0 && targetC < gridSize.cols) {
              activeGrid[targetR][targetC] = 1;
            }
          }
        });
      });
    });

    const rowSums = activeGrid.map(row => row.reduce((sum, val) => sum + val, 0));
    const colSums = Array(gridSize.cols).fill(0);
    for (let c = 0; c < gridSize.cols; c++) {
      for (let r = 0; r < gridSize.rows; r++) {
        colSums[c] += activeGrid[r][c];
      }
    }
    return { rowSums, colSums, activeGrid };
  };

  const { rowSums, colSums, activeGrid } = getGridSums();

  // Grid cell size in px (350px / 5 = 70px)
  const cellSize = 70;

  return (
    <div className={`circuitry-page ${draggedPiece ? "holding-piece" : ""}`} onContextMenu={draggedPiece ? handleContextMenu : undefined}>
      <Confetti active={showVictoryControls} />
      <div className="circuitry-panel">
        <h1 className="title">Originium Circuitry Module</h1>
        <p className="subtitle">Click components to the board to repair it</p>

        <div className="game-layout">

          {/* Left: Instructions Card */}
          <div className="instructions-sidebar">
            <h2 className="sidebar-title">Controls</h2>
            <div className="instructions-card">
              <div className="instruction-row">
                <span className="key-cap">Left Click</span>
                <span>Pick up / place pieces.</span>
              </div>
              <div className="instruction-row">
                <span className="key-cap">R or Right Click</span>
                <span>Rotate piece clockwise.</span>
              </div>
              <div className="instruction-row mobile-controls-info">
                <span className="key-cap">For Mobile</span>
                <span>Drag to move. Multi-touch to rotate.</span>
              </div>
            </div>
          </div>

          {/* Center: Main Puzzle Grid Container */}
          <div className="grid-outer-wrapper">

            {/* Top row labels for columns */}
            <div className="col-labels-row" style={{ gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)` }}>
              {colTargets.map((target, c) => {
                const satisfied = colSums[c] === target;
                return (
                  <div key={c} className={`label-cell col-label ${satisfied ? "satisfied" : ""}`}>
                    {target}
                  </div>
                );
              })}
            </div>

            {/* Grid rows with left row labels */}
            <div className="grid-and-row-labels">
              <div className="row-labels-column">
                {rowTargets.map((target, r) => {
                  const satisfied = rowSums[r] === target;
                  return (
                    <div key={r} className={`label-cell row-label ${satisfied ? "satisfied" : ""}`}>
                      {target}
                    </div>
                  );
                })}
              </div>

              {/* The 5x5 interactive board */}
              <div className="grid-board-wrapper">
                {/* Complete outline effect */}
                {triggerSolvedAnimation && <div className="completion-outline-effect"></div>}

                <div
                  ref={gridRef}
                  className="grid-board"
                  style={{
                    gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
                  }}
                >
                  {Array.from({ length: gridSize.rows }).map((_, r) =>
                    Array.from({ length: gridSize.cols }).map((_, c) => (
                      <div
                        key={`${r}-${c}`}
                        className="grid-cell"
                      />
                    ))
                  )}

                  {/* Render placed pieces*/}
                  {placedPieces.map((piece) => {
                    if (draggedPiece?.id === piece.id) return null;

                    return (
                      <div
                        key={piece.id}
                        className="placed-piece-svg-wrapper"
                        style={{
                          position: "absolute",
                          left: `${piece.c * cellSize}px`,
                          top: `${piece.r * cellSize}px`,
                          width: `${piece.shape[0].length * cellSize}px`,
                          height: `${piece.shape.length * cellSize}px`,
                          zIndex: 10,
                          pointerEvents: "none"
                        }}
                      >
                        <PieceSVG
                          shape={piece.shape}
                          cellSize={cellSize}
                          color={piece.color}
                          rotation={0}
                          onClick={(e) => handlePlacedPieceClick(e, piece)}
                          onTouchStart={(e) => handlePlacedPieceTouchStart(e, piece)}
                        />
                      </div>
                    );
                  })}

                  {/* Render hover grid preview as overlay */}
                  {draggedPiece && hoverGridPos && (() => {
                    const placeable = canPlacePiece(draggedPiece.shape, hoverGridPos.r, hoverGridPos.c, draggedPiece.id);
                    // Only draw preview if at least partially overlapping with grid boundaries
                    const sRows = draggedPiece.shape.length;
                    const sCols = draggedPiece.shape[0].length;
                    const outOfBounds = (
                      hoverGridPos.r < 0 || hoverGridPos.r + sRows > gridSize.rows ||
                      hoverGridPos.c < 0 || hoverGridPos.c + sCols > gridSize.cols
                    );
                    if (outOfBounds) return null;

                    return (
                      <div
                        className="placed-piece-svg-wrapper preview-overlay"
                        style={{
                          position: "absolute",
                          left: `${hoverGridPos.c * cellSize}px`,
                          top: `${hoverGridPos.r * cellSize}px`,
                          width: `${sCols * cellSize}px`,
                          height: `${sRows * cellSize}px`,
                          zIndex: 8,
                          pointerEvents: "none"
                        }}
                      >
                        <PieceSVG
                          shape={draggedPiece.shape}
                          cellSize={cellSize}
                          color={placeable ? "white" : "#ff3b30"}
                          opacity={0.6}
                          rotation={0}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Inline Victory Controls below the puzzle */}
            {showVictoryControls && (
              <div className="victory-controls-inline">
                {/* <h2 className="victory-title-inline">Circuit Connected</h2> */}
                <button className="play-again-btn" onClick={startNewGame}>
                  Next Circuit
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Inventory List (2 columns grid) */}
          <div className="inventory-sidebar">
            <h2 className="sidebar-title"></h2>

            <div className="inventory-grid">
              {inventory.map((piece) => {
                const isPlaced = placedPieces.some(p => p.id === piece.id);
                const isDragging = draggedPiece?.id === piece.id;
                const isEmpty = isPlaced || isDragging;

                return (
                  <div
                    key={piece.id}
                    className={`inventory-item-card ${isEmpty ? "empty-item" : ""}`}
                    onClick={(e) => handleInventoryPieceClick(e, piece)}
                    onTouchStart={(e) => handleInventoryPieceTouchStart(e, piece)}
                  >
                    {!isEmpty && (
                      <PieceSVG
                        shape={piece.shape}
                        cellSize={Math.min(22, 60 / Math.max(piece.shape.length, piece.shape[0].length))}
                        color={piece.color}
                        rotation={0}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {inventory.length === 0 && !isSolved && (
              <div className="empty-inventory-message">All pieces placed!</div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Drag Representation */}
      {draggedPiece && (() => {
        const originalRows = draggedPiece.originalShape.length;
        const originalCols = draggedPiece.originalShape[0].length;
        return (
          <div
            className="floating-drag-piece"
            style={{
              position: "fixed",
              pointerEvents: "none",
              zIndex: 10000,
              left: `${mousePos.x - (originalCols * cellSize) / 2}px`,
              top: `${mousePos.y - (originalRows * cellSize) / 2}px`,
            }}
          >
            <PieceSVG
              shape={draggedPiece.originalShape}
              cellSize={cellSize}
              color={draggedPiece.color}
              rotation={draggedPiece.visualRotation}
            />
          </div>
        );
      })()}
    </div>
  );
}

export default OriginiumCircuitry;
