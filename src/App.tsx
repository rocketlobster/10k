import React, { useState, useEffect } from 'react';
import { Player, Score } from './types';
import { Users, Trophy, RotateCcw } from 'lucide-react';

// Constants for localStorage
const GAME_STATE_KEY = '10k-game-state';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  // Load game state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    if (savedState) {
      const { players, currentPlayerIndex, gameStarted, winner, numPlayers } = JSON.parse(savedState);
      setPlayers(players);
      setCurrentPlayerIndex(currentPlayerIndex);
      setGameStarted(gameStarted);
      setWinner(winner);
      setNumPlayers(numPlayers);
    }
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameStarted) {
      const gameState = {
        players,
        currentPlayerIndex,
        gameStarted,
        winner,
        numPlayers
      };
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    }
  }, [players, currentPlayerIndex, gameStarted, winner, numPlayers]);

  const resetGame = () => {
    localStorage.removeItem(GAME_STATE_KEY);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setGameStarted(false);
    setWinner(null);
    setNumPlayers(2);
  };

  const initializePlayers = () => {
    const newPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => ({
      id: index,
      name: `Player ${index + 1}`,
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
    setCurrentPlayerIndex((prev) => (prev + 1) % numPlayers);
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
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800">10K Score Tracker</h1>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Players
            </label>
            <input
              type="number"
              min="2"
              max="6"
              value={numPlayers}
              onChange={(e) => setNumPlayers(Math.min(6, Math.max(2, parseInt(e.target.value))))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={initializePlayers}
            className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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