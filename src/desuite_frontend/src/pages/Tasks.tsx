import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Principal } from '@dfinity/principal';
import { 
  Award, 
  Calendar, 
  Filter, 
  Search,
  Loader2,
  ArrowUpDown,
  Users,
  Clock,
  ExternalLink
} from 'lucide-react';

// Backend types
type TaskStatus = {
  'active': null;
} | {
  'paused': null;
} | {
  'expired': null;
} | {
  'archived': null;
};

interface BackendTask {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  points: bigint;
  taskType: { [key: string]: null };
  category: string;
  createdAt: bigint;
  deadline: [] | [bigint];
  status: TaskStatus;
  creatorId: Principal;
  maxSubmissions: bigint;
  currentSubmissions: bigint;
  requirements: string[];
  visibility: { [key: string]: null };
}

// Frontend types
interface Task {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  points: number;
  taskType: string;
  category: string;
  createdAt: number;
  deadline: number | null;
  status: string;
  currentSubmissions: number;
  maxSubmissions: number;
  visibility: string;
}

type SortOption = 'newest' | 'oldest' | 'points-high' | 'points-low' | 'deadline';
type FilterOption = 'all' | 'active' | 'completed' | 'daily' | 'weekly' | 'monthly';

const transformTask = (backendTask: BackendTask): Task => ({
  id: backendTask.id,
  spaceId: backendTask.spaceId,
  title: backendTask.title,
  description: backendTask.description,
  points: Number(backendTask.points),
  taskType: Object.keys(backendTask.taskType)[0],
  category: backendTask.category,
  createdAt: Number(backendTask.createdAt),
  deadline: backendTask.deadline.length > 0 ? Number(backendTask.deadline[0]) : null,
  status: Object.keys(backendTask.status)[0],
  currentSubmissions: Number(backendTask.currentSubmissions),
  maxSubmissions: Number(backendTask.maxSubmissions),
  visibility: Object.keys(backendTask.visibility)[0]
});

export const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [spaces, setSpaces] = useState<Record<string, { name: string; color: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!user?.spaces || user.spaces.length === 0) {
          setIsLoading(false);
          return;
        }

        // Fetch space names first
        const spacePromises = user.spaces.map(spaceId => 
          desuite_backend.getSpace(spaceId)
        );
        const spaceResults = await Promise.all(spacePromises);
        const spaceData: Record<string, { name: string; color: string }> = {};
        spaceResults.forEach((result, index) => {
          if ('ok' in result) {
            spaceData[user.spaces[index]] = {
              name: result.ok.name,
              color: `hsl(${Math.random() * 360}, 70%, 50%)`
            };
          }
        });
        setSpaces(spaceData);

        // Fetch tasks for each space
        const taskPromises = user.spaces.map(spaceId => 
          desuite_backend.getSpaceTasks(spaceId)
        );
        const taskResults = await Promise.all(taskPromises);
        const allTasks = taskResults.flat().map(transformTask);
        setTasks(allTasks);
      } catch (err) {
        setError('Failed to load tasks. Please try again later.');
        console.error('Error fetching tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = 
        selectedFilter === 'all' ? true :
        selectedFilter === 'active' ? task.status === 'active' :
        selectedFilter === 'completed' ? task.status === 'completed' :
        task.taskType === selectedFilter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'points-high':
          return b.points - a.points;
        case 'points-low':
          return a.points - b.points;
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline - b.deadline;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500 mr-2" size={24} />
        <span>Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Available Tasks
            </h1>
            <p className="text-gray-400 mt-2">Complete tasks to earn points and rewards</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-lg border border-purple-500/30 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 flex items-center"
            >
              <Filter size={20} className="mr-2" />
              Filters
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 rounded-lg border border-purple-500/30 bg-black text-gray-400 focus:outline-none focus:border-purple-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="points-high">Highest Points</option>
              <option value="points-low">Lowest Points</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4 rounded-lg border border-purple-500/20 backdrop-blur-xl bg-black/40">
              {['all', 'active', 'completed', 'daily', 'weekly', 'monthly'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as FilterOption)}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedFilter === filter
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                      : 'border-purple-500/30 text-gray-400 hover:border-purple-500/50'
                  } transition-all duration-200`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedTasks.map((task) => (
            <div
              key={task.id}
              className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40 hover:border-purple-500/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {spaces[task.spaceId] && (
                      <span 
                        className="px-2 py-1 rounded-full text-xs text-white"
                        style={{ backgroundColor: spaces[task.spaceId].color }}
                      >
                        {spaces[task.spaceId].name}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      task.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{task.description}</p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center text-purple-400">
                      <Award size={16} className="mr-1" />
                      {task.points} points
                    </div>
                    {task.deadline && (
                      <div className="flex items-center text-gray-400">
                        <Calendar size={16} className="mr-1" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center text-gray-400">
                      <Users size={16} className="mr-1" />
                      {task.currentSubmissions}/{task.maxSubmissions} submissions
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Clock size={16} className="mr-1" />
                      {task.taskType}
                    </div>
                  </div>
                </div>

                <Link
                  to={`/spaces/${task.spaceId}/tasks/${task.id}`}
                  className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200 group"
                >
                  <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>
          ))}

          {filteredAndSortedTasks.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400">
                {searchQuery || selectedFilter !== 'all'
                  ? 'No tasks match your filters'
                  : 'No tasks available'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};