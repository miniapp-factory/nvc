"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function randomTileValue() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function emptyPositions(board: number[][]) {
  const positions: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) positions.push([r, c]);
    }
  }
  return positions;
}

function addRandomTile(board: number[][]) {
  const empties = emptyPositions(board);
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = randomTileValue();
  return newBoard;
}

function transpose(board: number[][]) {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: number[][]) {
  return board.map(row => [...row].reverse());
}

function slideAndMerge(row: number[]) {
  const nonZero = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < nonZero.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      merged.push(nonZero[i] * 2);
      skip = true;
    } else {
      merged.push(nonZero[i]);
    }
  }
  while (merged.length < GRID_SIZE) merged.push(0);
  return merged;
}

function move(board: number[][], direction: "up" | "down" | "left" | "right") {
  let newBoard = board;
  if (direction === "up" || direction === "down") {
    newBoard = transpose(newBoard);
  }
  if (direction === "right" || direction === "down") {
    newBoard = reverseRows(newBoard);
  }
  newBoard = newBoard.map(row => slideAndMerge(row));
  if (direction === "right" || direction === "down") {
    newBoard = reverseRows(newBoard);
  }
  if (direction === "up" || direction === "down") {
    newBoard = transpose(newBoard);
  }
  return newBoard;
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    let newBoard = addRandomTile(board);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      let dir: "up" | "down" | "left" | "right" | null = null;
      switch (e.key) {
        case "ArrowUp":
          dir = "up";
          break;
        case "ArrowDown":
          dir = "down";
          break;
        case "ArrowLeft":
          dir = "left";
          break;
        case "ArrowRight":
          dir = "right";
          break;
      }
      if (dir) {
        const newBoard = move(board, dir);
        if (JSON.stringify(newBoard) !== JSON.stringify(board)) {
          const addedScore = newBoard.flat().reduce((s, v) => s + v, 0) - board.flat().reduce((s, v) => s + v, 0);
          setScore(prev => prev + addedScore);
          const updatedBoard = addRandomTile(newBoard);
          setBoard(updatedBoard);
          if (updatedBoard.flat().includes(2048)) setWon(true);
          if (!emptyPositions(updatedBoard).length && !canMove(updatedBoard)) setGameOver(true);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [board, gameOver]);

  function canMove(b: number[][]) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === 0) return true;
        if (c + 1 < GRID_SIZE && b[r][c] === b[r][c + 1]) return true;
        if (r + 1 < GRID_SIZE && b[r][c] === b[r + 1][c]) return true;
      }
    }
    return false;
  }

  const renderTile = (value: number, key: string) => (
    <div
      key={key}
      className={`flex items-center justify-center rounded-md text-2xl font-bold ${
        value === 0
          ? "bg-muted"
          : value <= 4
          ? "bg-primary text-primary-foreground"
          : value <= 8
          ? "bg-secondary text-secondary-foreground"
          : value <= 16
          ? "bg-accent text-accent-foreground"
          : "bg-destructive text-destructive-foreground"
      }`}
    >
      {value !== 0 ? value : null}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, i) => renderTile(v, `tile-${i}`))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => move(board, "up")}>↑</Button>
        <Button onClick={() => move(board, "left")}>←</Button>
        <Button onClick={() => move(board, "right")}>→</Button>
        <Button onClick={() => move(board, "down")}>↓</Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-semibold">{won ? "You won!" : "Game Over"}</span>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
