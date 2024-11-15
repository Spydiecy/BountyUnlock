import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { 
  Award, 
  CheckCircle, 
  Clock, 
  Settings,
  Loader2,
  Trophy,
  Star,
  Activity
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  points: number;
  status: string;
  completedAt: bigint;
}

interface UserStats {
  totalPoints: number;
  completedTasks: number;
  pendingSubmissions: number;
  ranking: number;
}

export const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const statsResult = await desuite_backend.getUserStats(user!.id);
        if ('ok' in statsResult) {
          setStats(statsResult.ok);
        }

        const tasksResult = await desuite_backend.getUserCompletedTasks(user!.id);
        setRecentTasks(tasksResult);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold">{user?.username}</h1>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button className="p-2 rounded-lg border border-purple-500/30 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Points', value: stats?.totalPoints || 0, icon: Award },
            { label: 'Tasks Completed', value: stats?.completedTasks || 0, icon: CheckCircle },
            { label: 'Current Rank', value: stats?.ranking || 0, icon: Trophy },
            { label: 'Pending Tasks', value: stats?.pendingSubmissions || 0, icon: Clock },
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
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="flex items-center text-purple-400">
                          <Award size={16} className="mr-1" />
                          {task.points} points
                        </span>
                        <span className="text-gray-400 text-sm">
                          {new Date(Number(task.completedAt)).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        task.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {task.status}
                      </span>
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
              {[
                { name: 'Early Adopter', description: 'Joined during beta phase', icon: Star },
                { name: 'Task Master', description: 'Completed 10 tasks', icon: CheckCircle },
                { name: 'Point Collector', description: 'Earned 1000 points', icon: Award },
                { name: 'Active Member', description: 'Joined 5 spaces', icon: Users }
              ].map((achievement, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-purple-500/20 backdrop-blur-xl bg-black/40"
                >
                  <achievement.icon className="text-purple-400 mb-2" size={24} />
                  <h3 className="font-medium text-white mb-1">{achievement.name}</h3>
                  <p className="text-gray-400 text-sm">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};