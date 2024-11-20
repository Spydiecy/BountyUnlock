import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Principal } from '@dfinity/principal';
import { Layout as LayoutIcon, Plus, Award, Users, Activity, Loader2 } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  description: string;
  members: string[];
  adminId: string;
  categories: string[];
  isPublic: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  points: bigint;
  status: { [key: string]: null };
  createdAt: bigint;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all spaces
        const allSpacesResult = await desuite_backend.getAllSpaces();
        // Filter spaces where user is a member
        const userSpaces = allSpacesResult.filter(space => 
          space.members.some(member => 
            member.toString() === user.id
          )
        );
        
        setSpaces(userSpaces.map(space => ({
          id: space.id,
          name: space.name,
          description: space.description,
          members: space.members.map(member => member.toString()),
          adminId: space.adminId.toString(),
          categories: space.categories,
          isPublic: space.isPublic
        })));

        // Fetch tasks for each space
        const allTasks = [];
        for (const space of userSpaces) {
          const spaceTasks = await desuite_backend.getSpaceTasks(space.id);
          allTasks.push(...spaceTasks);
        }
        setTasks(allTasks);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500 mr-2" size={24} />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const activeTasks = tasks.filter(task => 'active' in task.status).length;
  const totalMembers = spaces.reduce((acc, space) => acc + space.members.length, 0);

  return (
    <div className="min-h-screen bg-black text-white">
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
            { label: 'Active Tasks', value: activeTasks, icon: Activity },
            { label: 'Total Members', value: totalMembers, icon: Users },
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
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center">
                    <Users size={16} className="mr-2" />
                    {space.members.length} members
                  </div>
                  {!space.isPublic && (
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20">
                      Private
                    </span>
                  )}
                </div>
              </Link>
            ))}

            {spaces.length === 0 && !isLoading && (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-400 mb-4">No spaces yet</p>
                <Link
                  to="/spaces/create"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  <Plus size={18} className="mr-2" />
                  Create Your First Space
                </Link>
              </div>
            )}
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
                    <span className="text-purple-400 font-semibold">{Number(task.points)} points</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      'active' in task.status 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {Object.keys(task.status)[0]}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-400">
                No tasks available
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};