import React, { useState, useEffect } from 'react';
import { Player, Score } from './types';
import { Users, Trophy, RotateCcw, Plus, X } from 'lucide-react';

// Constants for localStorage
const GAME_STATE_KEY = '10k-game-state';
const MAX_PLAYERS = 6;

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  // Load game state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    if (savedState) {
      const { players, currentPlayerIndex, gameStarted, winner } = JSON.parse(savedState);
      setPlayers(players);
      setCurrentPlayerIndex(currentPlayerIndex);
      setGameStarted(gameStarted);
      setWinner(winner);
    }
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameStarted) {
      const gameState = {
        players,
        currentPlayerIndex,
        gameStarted,
        winner
      };
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    }
  }, [players, currentPlayerIndex, gameStarted, winner]);

  const resetGame = () => {
    localStorage.removeItem(GAME_STATE_KEY);
    setPlayers([]);
    setPlayerNames([]);
    setNewPlayerName('');
    setCurrentPlayerIndex(0);
    setGameStarted(false);
    setWinner(null);
  };

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    if (playerNames.length >= MAX_PLAYERS) return;
    
    setPlayerNames(prev => [...prev, newPlayerName.trim()]);
    setNewPlayerName('');
  };

  const removePlayer = (index: number) => {
    setPlayerNames(prev => prev.filter((_, i) => i !== index));
  };

  const initializePlayers = () => {
    if (playerNames.length < 2) {
      alert('Please add at least 2 players');
      return;
    }

    const newPlayers: Player[] = playerNames.map((name, index) => ({
      id: index,
      name: name,
      scores: [],
      currentScore: null
    }));
    setPlayers(newPlayers);
    setGameStarted(true);
  };

  const handleScoreSubmit = (newScore: number) => {
    if (newScore <= 0) return;
    
    const currentPlayer = players[currentPlayerIndex];
    const updatedPlayers = [...players];
    
    // Get the last valid score
    const lastValidScore = currentPlayer.scores
      .filter(score => !score.isStrikethrough)
      .pop()?.value || 0;
    
    // Calculate total score (previous + new)
    const totalScore = lastValidScore + newScore;

    // Check if score exists in other players' scores
    players.forEach((player, idx) => {
      if (idx !== currentPlayerIndex) {
        const matchingScoreIndex = player.scores.findIndex(s => s.value === totalScore && !s.isStrikethrough);
        if (matchingScoreIndex !== -1) {
          updatedPlayers[idx].scores[matchingScoreIndex].isStrikethrough = true;
        }
      }
    });

    // Add total score to current player
    updatedPlayers[currentPlayerIndex].scores.push({
      value: totalScore,
      isStrikethrough: false,
      passes: 0
    });
    updatedPlayers[currentPlayerIndex].currentScore = null;

    setPlayers(updatedPlayers);
    nextPlayer();
  };

  const handlePass = () => {
    const updatedPlayers = [...players];
    const currentPlayer = updatedPlayers[currentPlayerIndex];
    
    // Get the last non-strikethrough score
    const lastValidScoreIndex = [...currentPlayer.scores]
      .reverse()
      .findIndex(score => !score.isStrikethrough);
    
    if (lastValidScoreIndex !== -1) {
      const actualIndex = currentPlayer.scores.length - 1 - lastValidScoreIndex;
      currentPlayer.scores[actualIndex].passes += 1;
      
      if (currentPlayer.scores[actualIndex].passes === 3) {
        currentPlayer.scores[actualIndex].isStrikethrough = true;
        // No need to add a new score entry, the total will automatically
        // be calculated from the last non-strikethrough score
      }
    }

    setPlayers(updatedPlayers);
    nextPlayer();
  };

  const nextPlayer = () => {
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
  };

  const getLastValidScore = (scores: Score[]): number => {
    return scores
      .filter(score => !score.isStrikethrough)
      .pop()?.value || 0;
  };

  const getPassWarning = (passes: number) => {
    if (passes === 0) return null;
    if (passes === 1) return "❌";
    if (passes === 2) return "❌❌";
    return null;
  };

  useEffect(() => {
    // Check for winner
    const lastValidScore = getLastValidScore(players[currentPlayerIndex]?.scores || []);
    if (lastValidScore >= 10000) {
      setWinner(players[currentPlayerIndex]);
    }
  }, [players, currentPlayerIndex]);

  if (winner) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {winner.name} Wins!
          </h1>
          <p className="text-gray-600 mb-4">
            Final Score: {getLastValidScore(winner.scores)} points
          </p>
          <button
            onClick={resetGame}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800">10K Score Tracker</h1>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Players ({playerNames.length}/6)</h2>
            <div className="space-y-2 mb-4">
              {playerNames.map((name, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-700">{name}</span>
                  <button
                    onClick={() => removePlayer(index)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <form onSubmit={addPlayer} className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={playerNames.length >= MAX_PLAYERS}
              />
              <button
                type="submit"
                disabled={!newPlayerName.trim() || playerNames.length >= MAX_PLAYERS}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <button
            onClick={initializePlayers}
            disabled={playerNames.length < 2}
            className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {players[currentPlayerIndex].name}'s Turn
            </h1>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Game
            </button>
          </div>
          <div className="flex gap-4 mb-6">
            <form 
              className="flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (players[currentPlayerIndex].currentScore === 0) {
                  handlePass();
                } else if (players[currentPlayerIndex].currentScore) {
                  handleScoreSubmit(players[currentPlayerIndex].currentScore);
                }
              }}
            >
              <input
                type="number"
                placeholder="Enter score"
                value={players[currentPlayerIndex].currentScore === null ? '' : players[currentPlayerIndex].currentScore}
                onChange={(e) => {
                  const updatedPlayers = [...players];
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  updatedPlayers[currentPlayerIndex].currentScore = value;
                  setPlayers(updatedPlayers);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>
            <button
              onClick={() => {
                const currentScore = players[currentPlayerIndex].currentScore || 0;
                if (currentScore === 0) {
                  handlePass();
                } else {
                  handleScoreSubmit(currentScore);
                }
              }}
              disabled={players[currentPlayerIndex].currentScore === null}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              Submit Score
            </button>
            <button
              onClick={handlePass}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Pass
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div
              key={player.id}
              className={`bg-white rounded-lg shadow-lg p-6 ${
                currentPlayerIndex === player.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-2">{player.name}</h2>
              <p className="text-gray-600 mb-4">
                Score actuel: {getLastValidScore(player.scores)} points
              </p>
              <div className="space-y-2">
                {player.scores.map((score, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className={`text-gray-700 ${
                      score.isStrikethrough ? 'line-through text-gray-400' : ''
                    }`}>
                      {score.value} points
                    </span>
                    {score.passes > 0 && !score.isStrikethrough && (
                      <span className="text-amber-500 font-medium">
                        {getPassWarning(score.passes)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;