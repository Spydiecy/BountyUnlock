import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Trophy, Medal, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  rank: number;
  change: number; // Position change since last week
}

export const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const result = await desuite_backend.getLeaderboard();
        // Transform the data and add rank and change info
        const leaderboardData = result.map((entry, index) => ({
          id: entry[0].toString(),
          username: entry[1],
          points: Number(entry[2]),
          rank: index + 1,
          change: Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1) // Mock data for position change
        }));
        
        setLeaderboard(leaderboardData);
        
        // Find user's rank
        const currentUser = leaderboardData.find(entry => entry.id === user?.id);
        if (currentUser) {
          setUserRank(currentUser);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe]);

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400">Top contributors in the community</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'month', 'week'].map((option) => (
              <button
                key={option}
                onClick={() => setTimeframe(option as 'all' | 'month' | 'week')}
                className={`px-4 py-2 rounded-lg border ${
                  timeframe === option
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                    : 'border-purple-500/30 text-gray-400 hover:border-purple-500/50'
                } transition-all duration-200`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {filteredLeaderboard.slice(0, 3).map((entry, index) => (
            <div
              key={entry.id}
              className={`p-6 rounded-2xl border backdrop-blur-xl bg-black/40 ${
                index === 0
                  ? 'border-yellow-500/30'
                  : index === 1
                  ? 'border-gray-400/30'
                  : 'border-yellow-700/30'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <h3 className="font-semibold text-lg mb-1">{entry.username}</h3>
                <p className="text-purple-400 font-medium">{entry.points} points</p>
                <div className="flex items-center justify-center mt-2 text-sm">
                  {entry.change > 0 ? (
                    <span className="flex items-center text-green-400">
                      <ChevronUp size={16} />
                      {entry.change}
                    </span>
                  ) : entry.change < 0 ? (
                    <span className="flex items-center text-red-400">
                      <ChevronDown size={16} />
                      {Math.abs(entry.change)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/20">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Points</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Change</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.slice(3).map((entry) => (
                <tr
                  key={entry.id}
                  className={`border-b border-purple-500/10 ${
                    entry.id === user?.id ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    #{entry.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-sm font-medium">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-3">{entry.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-purple-400">
                    {entry.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {entry.change > 0 ? (
                      <span className="text-green-400 flex items-center justify-end">
                        <ChevronUp size={16} />
                        {entry.change}
                      </span>
                    ) : entry.change < 0 ? (
                      <span className="text-red-400 flex items-center justify-end">
                        <ChevronDown size={16} />
                        {Math.abs(entry.change)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User's Current Position */}
        {userRank && (
          <div className="mt-8 p-4 rounded-lg border border-purple-500/20 backdrop-blur-xl bg-black/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="text-purple-400 mr-3" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Your Position</p>
                  <p className="font-medium">Rank #{userRank.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Points to Next Rank</p>
                <p className="font-medium text-purple-400">
                  {leaderboard[userRank.rank - 2]?.points - userRank.points || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};