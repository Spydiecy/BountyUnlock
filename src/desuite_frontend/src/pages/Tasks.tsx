import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { 
  Award, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Link as LinkIcon,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  taskType: string;
  status: string;
  createdAt: bigint;
  deadline: bigint | null;
  requirements: string[];
  visibility: string;
  maxSubmissions: number;
  currentSubmissions: number;
  creatorId: string;
}

interface Submission {
  id: string;
  proof: string;
  submittedAt: bigint;
  status: string;
  reviewerNotes?: string;
}

export const Tasks = () => {
  const { spaceId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [proofText, setProofText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!spaceId || !taskId) return;

      try {
        // Fetch task details
        const taskResult = await desuite_backend.getTask(taskId);
        if ('ok' in taskResult) {
          setTask(taskResult.ok);
          
          // Fetch user's submission if exists
          const submissionResult = await desuite_backend.getUserTaskSubmission(taskId);
          if ('ok' in submissionResult) {
            setSubmission(submissionResult.ok);
          }
        } else {
          setError('Task not found');
        }
      } catch (err) {
        setError('Failed to load task data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [spaceId, taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await desuite_backend.submitTask(taskId!, proofText);
      if ('ok' in result) {
        setSubmission(result.ok);
        setProofText('');
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
          <h2 className="text-xl font-bold mb-2">Task Not Found</h2>
          <p className="text-gray-400">This task might have been removed or doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Task Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            {task.title}
          </h1>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center text-purple-400">
              <Award className="mr-2" size={18} />
              {task.points} points
            </div>
            {task.deadline && (
              <div className="flex items-center text-gray-400">
                <Calendar className="mr-2" size={18} />
                {new Date(Number(task.deadline)).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center text-gray-400">
              <Clock className="mr-2" size={18} />
              {task.taskType}
            </div>
            <div className="flex items-center text-gray-400">
              <Users className="mr-2" size={18} />
              {task.currentSubmissions}/{task.maxSubmissions} submissions
            </div>
          </div>
        </div>

        {/* Task Description */}
        <div className="mb-8 p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
        </div>

        {/* Requirements */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Requirements</h2>
          <div className="space-y-2">
            {task.requirements.map((req, index) => (
              <div
                key={index}
                className="flex items-start p-4 rounded-lg border border-purple-500/20 bg-black/40"
              >
                <CheckCircle className="text-purple-400 mr-3 mt-0.5 flex-shrink-0" size={18} />
                <span className="text-gray-300">{req}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Form or Status */}
        {submission ? (
          <div className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
            <h2 className="text-xl font-semibold mb-4">Your Submission</h2>
            <div className={`p-4 rounded-lg ${
              submission.status === 'approved'
                ? 'bg-green-500/10 border border-green-500/30'
                : submission.status === 'rejected'
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-yellow-500/10 border border-yellow-500/30'
            }`}>
              <div className="flex items-center mb-4">
                {submission.status === 'approved' ? (
                  <CheckCircle className="text-green-400 mr-2" size={20} />
                ) : submission.status === 'rejected' ? (
                  <XCircle className="text-red-400 mr-2" size={20} />
                ) : (
                  <Clock className="text-yellow-400 mr-2" size={20} />
                )}
                <span className={`font-medium ${
                  submission.status === 'approved'
                    ? 'text-green-400'
                    : submission.status === 'rejected'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
              </div>
              <div className="text-gray-300">
                <p className="mb-2">Submitted on: {new Date(Number(submission.submittedAt)).toLocaleString()}</p>
                <p className="whitespace-pre-wrap">{submission.proof}</p>
                {submission.reviewerNotes && (
                  <div className="mt-4 p-4 rounded-lg bg-black/30">
                    <p className="text-sm text-gray-400 mb-2">Reviewer Notes:</p>
                    <p>{submission.reviewerNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
            <h2 className="text-xl font-semibold mb-4">Submit Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Proof of Completion
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="Describe how you completed the task..."
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm flex items-center">
                  <AlertCircle className="mr-2" size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Submitting...
                  </>
                ) : (
                  'Submit Task'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};