import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Users, Settings, Award, Plus, Calendar, ArrowRight, ExternalLink } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  taskType: string;
  createdAt: bigint;
  deadline: bigint | null;
  visibility: string;
}

interface Space {
  id: string;
  name: string;
  description: string;
  members: string[];
  adminId: string;
  categories: string[];
  isPublic: boolean;
}

export const Space = () => {
  const { spaceId } = useParams();
  const { user } = useAuth();
  const [space, setSpace] = useState<Space | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const fetchSpaceData = async () => {
      if (!spaceId) return;

      try {
        const spaceResult = await desuite_backend.getSpace(spaceId);
        if ('ok' in spaceResult) {
          const spaceData = spaceResult.ok;
          setSpace(spaceData);
          setIsAdmin(spaceData.adminId === user?.id);
          setIsMember(spaceData.members.includes(user?.id || ''));

          const tasksResult = await desuite_backend.getSpaceTasks(spaceId);
          setTasks(tasksResult);
        }
      } catch (error) {
        console.error('Error fetching space data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaceData();
  }, [spaceId, user]);

  const handleJoinSpace = async () => {
    if (!spaceId) return;
    try {
      const result = await desuite_backend.joinSpace(spaceId);
      if ('ok' in result) {
        setSpace(result.ok);
        setIsMember(true);
      }
    } catch (error) {
      console.error('Error joining space:', error);
    }
  };

  const filteredTasks = tasks.filter(task => 
    selectedCategory === 'all' || task.taskType === selectedCategory
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!space) {
    return <div>Space not found</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Space Header */}
      <div className="border-b border-purple-500/20 backdrop-blur-xl bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                {space.name}
              </h1>
              <p className="text-gray-400 mt-2 max-w-2xl">{space.description}</p>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center text-gray-400">
                  <Users size={16} className="mr-2" />
                  {space.members.length} members
                </div>
                {space.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!isMember && (
                <button
                  onClick={handleJoinSpace}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                >
                  Join Space
                </button>
              )}
              {isAdmin && (
                <Link
                  to={`/spaces/${spaceId}/settings`}
                  className="p-2 rounded-lg border border-purple-500/30 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
                >
                  <Settings size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Task Categories */}
        <div className="flex gap-2 mb-8">
          {['all', 'daily', 'weekly', 'monthly'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg border ${
                selectedCategory === category
                  ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                  : 'border-purple-500/30 text-gray-400 hover:border-purple-500/50'
              } transition-all duration-200`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {isAdmin && (
            <Link
              to={`/spaces/${spaceId}/tasks/create`}
              className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40 hover:border-purple-500/40 transition-all duration-300 flex items-center justify-center group"
            >
              <Plus size={20} className="mr-2 text-purple-400" />
              <span className="text-purple-400">Create New Task</span>
            </Link>
          )}

          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{task.description}</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-purple-400">
                      <Award size={16} className="mr-1" />
                      {task.points} points
                    </div>
                    {task.deadline && (
                      <div className="flex items-center text-gray-400">
                        <Calendar size={16} className="mr-1" />
                        {new Date(Number(task.deadline)).toLocaleDateString()}
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/spaces/${spaceId}/tasks/${task.id}`}
                  className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No tasks found</p>
            {isAdmin && (
              <Link
                to={`/spaces/${spaceId}/tasks/create`}
                className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                <Plus size={20} className="mr-2" />
                Create First Task
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};