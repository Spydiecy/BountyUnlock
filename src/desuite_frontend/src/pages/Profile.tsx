import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Principal } from '@dfinity/principal';
import { Navbar } from '../components/Navbar';
import { 
  Award, 
  CheckCircle, 
  Clock, 
  Settings,
  Loader2,
  Trophy,
  Star,
  Activity,
  Users as UsersIcon,
  Edit3
} from 'lucide-react';

// Types
interface UserStats {
  totalPoints: number;
  completedTasks: number;
  pendingSubmissions: number;
  ranking: number;
}

interface UserTask {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  completedAt: number;
  spaceId: string;
}

interface ProfileState {
  isEditing: boolean;
  username: string;
  bio: string;
}

export const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<UserTask[]>([]);
  const [spaces, setSpaces] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileState, setProfileState] = useState<ProfileState>({
    isEditing: false,
    username: user?.username || '',
    bio: ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;

      try {
        // Convert user ID to Principal
        const userPrincipal = Principal.fromText(user.id);

        // Fetch user stats
        const statsResult = await desuite_backend.getUserStats(userPrincipal);
        if ('ok' in statsResult) {
          setStats({
            totalPoints: Number(statsResult.ok.totalPoints),
            completedTasks: Number(statsResult.ok.completedTasks),
            pendingSubmissions: Number(statsResult.ok.pendingSubmissions),
            ranking: Number(statsResult.ok.ranking)
          });
        }

        // Fetch completed tasks
        const tasksResult = await desuite_backend.getUserCompletedTasks(userPrincipal);
        const transformedTasks = tasksResult.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          points: Number(task.points),
          status: Object.keys(task.status)[0],
          completedAt: Number(task.createdAt),
          spaceId: task.spaceId
        }));
        setRecentTasks(transformedTasks);

        // Fetch space names
        const spacePromises = tasksResult.map(task => 
          desuite_backend.getSpace(task.spaceId)
        );
        const spaceResults = await Promise.all(spacePromises);
        const spaceNames: Record<string, string> = {};
        spaceResults.forEach((result, index) => {
          if ('ok' in result) {
            spaceNames[tasksResult[index].spaceId] = result.ok.name;
          }
        });
        setSpaces(spaceNames);

      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const getAchievements = () => {
    if (!stats) return [];

    return [
      {
        name: 'Early Adopter',
        description: 'Joined during beta phase',
        icon: Star,
        achieved: true
      },
      {
        name: 'Task Master',
        description: `Completed ${stats.completedTasks}/10 tasks`,
        icon: CheckCircle,
        achieved: stats.completedTasks >= 10
      },
      {
        name: 'Point Collector',
        description: `Earned ${stats.totalPoints}/1000 points`,
        icon: Award,
        achieved: stats.totalPoints >= 1000
      },
      {
        name: 'Top Contributor',
        description: 'Reached top 10 ranking',
        icon: Trophy,
        achieved: stats.ranking <= 10
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500 mr-2" size={24} />
        <span>Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Background Banner - could be customizable */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 h-48 rounded-lg" />
          
          <div className="relative pt-24 px-8">
            <div className="flex items-center gap-6">
              {/* Profile Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-3xl font-bold border-4 border-black">
                {user?.username.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold">{user?.username}</h1>
                  <button className="p-2 rounded-lg border border-purple-500/30 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10">
                    <Edit3 size={16} />
                  </button>
                </div>
                <p className="text-gray-400 mt-1">Member since {new Date().toLocaleDateString()}</p>
              </div>

              {stats?.ranking && (
                <div className="text-right">
                  <div className="text-xl font-bold text-purple-400">#{stats.ranking}</div>
                  <div className="text-gray-400 text-sm">Global Rank</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Points', value: stats?.totalPoints || 0, icon: Award },
            { label: 'Tasks Completed', value: stats?.completedTasks || 0, icon: CheckCircle },
            { label: 'Pending Tasks', value: stats?.pendingSubmissions || 0, icon: Clock },
            { label: 'Spaces Joined', value: user?.spaces.length || 0, icon: UsersIcon },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="text-purple-400" size={24} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Activity className="mr-2 text-purple-400" size={24} />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border border-purple-500/20 backdrop-blur-xl bg-black/40 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white">{task.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="flex items-center text-purple-400">
                          <Award size={16} className="mr-1" />
                          {task.points} points
                        </span>
                        <span className="text-gray-400 text-sm">
                          {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                        {spaces[task.spaceId] && (
                          <span className="text-gray-400 text-sm">
                            in {spaces[task.spaceId]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {recentTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No completed tasks yet
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Trophy className="mr-2 text-purple-400" size={24} />
              Achievements
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {getAchievements().map((achievement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border backdrop-blur-xl bg-black/40 ${
                    achievement.achieved 
                      ? 'border-purple-500/20 text-white' 
                      : 'border-gray-700/20 text-gray-500'
                  }`}
                >
                  <achievement.icon 
                    className={achievement.achieved ? "text-purple-400 mb-2" : "text-gray-600 mb-2"} 
                    size={24} 
                  />
                  <h3 className="font-medium mb-1">{achievement.name}</h3>
                  <p className="text-sm opacity-80">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};