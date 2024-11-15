import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ChevronRight, Award, Users, Zap, Shield } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-20">
        {/* Gradient Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_-20%,#6b21a8,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_100%,#701a75,transparent_45%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400">
                Complete Tasks.
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                Earn Rewards.
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join our community-driven platform where your contributions are valued and rewarded. Complete tasks, climb the leaderboard, and unlock amazing opportunities.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center group"
              >
                Get Started
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/spaces"
                className="px-8 py-4 rounded-lg border border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300"
              >
                Explore Spaces
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Award,
              title: "Complete Tasks",
              description: "Take on challenges and earn points by completing tasks in your favorite spaces."
            },
            {
              icon: Users,
              title: "Join Communities",
              description: "Connect with like-minded individuals in specialized spaces and contribute together."
            },
            {
              icon: Zap,
              title: "Earn Rewards",
              description: "Convert your earned points into rewards and unlock exclusive opportunities."
            },
            {
              icon: Shield,
              title: "Build Reputation",
              description: "Establish your credibility and climb the ranks in your chosen domains."
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40 hover:border-purple-500/40 transition-all duration-300"
            >
              <feature.icon className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-purple-500/20 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10K+", label: "Active Users" },
              { value: "500+", label: "Spaces" },
              { value: "50K+", label: "Tasks Completed" },
              { value: "100K+", label: "Points Awarded" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                  {stat.value}
                </div>
                <div className="text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};