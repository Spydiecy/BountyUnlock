import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Layout as LayoutIcon, Plus, Award, Users, Activity } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  description: string;
  members: string[];
  isPublic: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's spaces and active tasks
        const spaceResults = await desuite_backend.getSpaceTasks(user?.spaces || []);
        const tasksResults = await Promise.all(
          user?.spaces.map(spaceId => desuite_backend.getSpaceTasks(spaceId)) || []
        );

        setSpaces(spaceResults);
        setTasks(tasksResults.flat());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-400 mt-2">Here's what's happening in your spaces</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Points', value: user?.points || 0, icon: Award },
            { label: 'Active Spaces', value: spaces.length, icon: LayoutIcon },
            { label: 'Pending Tasks', value: tasks.length, icon: Activity },
            { label: 'Total Submissions', value: '12', icon: Users }, // Replace with actual data
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

        {/* Your Spaces */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Spaces</h2>
            <Link
              to="/spaces/create"
              className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              <Plus size={18} className="mr-2" />
              Create Space
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spaces.map((space) => (
              <Link
                key={space.id}
                to={`/spaces/${space.id}`}
                className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40 hover:border-purple-500/40 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold mb-2">{space.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{space.description}</p>
                <div className="flex items-center text-sm text-gray-400">
                  <Users size={16} className="mr-2" />
                  {space.members.length} members
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Tasks</h2>
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
                    <p className="text-gray-400 text-sm">{task.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-400 font-semibold">{task.points} points</span>
                    <span className="ml-2 px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};