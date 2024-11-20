import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Principal } from '@dfinity/principal';
import { 
  Plus, 
  Search, 
  Users, 
  Lock, 
  Unlock, 
  ArrowRight,
  Loader2,
  Filter
} from 'lucide-react';

// Types for type safety
interface BackendSpace {
  id: string;
  name: string;
  description: string;
  createdAt: bigint;
  adminId: Principal;
  logo: [] | [string];
  banner: [] | [string];
  members: Principal[];
  categories: string[];
  isPublic: boolean;
}

interface Space {
  id: string;
  name: string;
  description: string;
  members: string[];
  isPublic: boolean;
  adminId: string;
  categories: string[];
  createdAt: number;
}

export const Spaces = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'joined' | 'public'>('all');

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      setIsLoading(true);
      const result = await desuite_backend.getAllSpaces();
      console.log('Spaces result:', result); // Debug log

      const transformedSpaces: Space[] = result.map(space => ({
        id: space.id,
        name: space.name,
        description: space.description,
        members: space.members.map(principal => principal.toString()),
        adminId: space.adminId.toString(),
        isPublic: space.isPublic,
        categories: space.categories,
        createdAt: Number(space.createdAt)
      }));

      setSpaces(transformedSpaces);
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setError('Failed to load spaces. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter spaces based on search and filter
  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = 
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'joined' ? space.members.includes(user?.id || '') :
      filter === 'public' ? space.isPublic : true;

    return matchesSearch && matchesFilter;
  });

  // Join space functionality
  const handleJoinSpace = async (spaceId: string) => {
    try {
      const result = await desuite_backend.joinSpace(spaceId);
      if ('ok' in result) {
        await fetchSpaces(); // Refresh the spaces list
      } else {
        setError('Failed to join space: ' + result.err);
      }
    } catch (err) {
      console.error('Error joining space:', err);
      setError('Failed to join space. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500 mr-2" size={24} />
        <span>Loading spaces...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Explore Spaces
            </h1>
            <p className="text-gray-400 mt-2">Discover and join amazing communities</p>
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <div
              key={space.id}
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

                {space.members.includes(user?.id || '') ? (
                  <Link
                    to={`/spaces/${space.id}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200"
                  >
                    <ArrowRight size={20} />
                  </Link>
                ) : space.isPublic && (
                  <button
                    onClick={() => handleJoinSpace(space.id)}
                    className="px-4 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all duration-200 text-sm"
                  >
                    Join Space
                  </button>
                )}
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {space.description}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-400">
                  <Users size={16} className="mr-2" />
                  {space.members.length} members
                </div>
                {space.categories.length > 0 && (
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
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSpaces.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {searchQuery || filter !== 'all'
                ? 'No spaces match your filters'
                : 'No spaces available'}
            </div>
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