import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Plus, Search, Users, Lock, Unlock, ArrowRight } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  description: string;
  members: string[];
  isPublic: boolean;
  adminId: string;
  categories: string[];
}

export const Spaces = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'joined' | 'public'>('all');

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const allSpaces = await desuite_backend.getAllSpaces();
        setSpaces(allSpaces);
      } catch (error) {
        console.error('Error fetching spaces:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         space.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' ? true :
                         filter === 'joined' ? space.members.includes(user?.id || '') :
                         filter === 'public' ? space.isPublic : true;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Explore Spaces
            </h1>
            <p className="text-gray-400 mt-2">Discover and join communities</p>
          </div>
          <Link
            to="/spaces/create"
            className="mt-4 md:mt-0 flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            <Plus size={20} className="mr-2" />
            Create Space
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'joined', 'public'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as 'all' | 'joined' | 'public')}
                className={`px-4 py-2 rounded-lg border ${
                  filter === filterOption
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                    : 'border-purple-500/30 text-gray-400 hover:border-purple-500/50'
                } transition-all duration-200`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <Link
              key={space.id}
              to={`/spaces/${space.id}`}
              className="group p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40 hover:border-purple-500/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {space.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {space.isPublic ? (
                      <Unlock size={14} className="text-gray-400" />
                    ) : (
                      <Lock size={14} className="text-gray-400" />
                    )}
                    <span className="text-sm text-gray-400">
                      {space.isPublic ? 'Public' : 'Private'} Space
                    </span>
                  </div>
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {space.description}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-400">
                  <Users size={16} className="mr-2" />
                  {space.members.length} members
                </div>
                <div className="flex flex-wrap gap-2">
                  {space.categories.slice(0, 2).map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredSpaces.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No spaces found</div>
            <Link
              to="/spaces/create"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              <Plus size={18} className="mr-2" />
              Create a new space
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};