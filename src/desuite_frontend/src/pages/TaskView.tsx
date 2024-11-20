import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Principal } from '@dfinity/principal';
import { 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  Github,
  Twitter,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Users
} from 'lucide-react';

// Backend types
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
  status: { [key: string]: null };
  creatorId: Principal;
  maxSubmissions: bigint;
  currentSubmissions: bigint;
  requirements: string[];
  visibility: { [key: string]: null };
}

interface BackendSubmission {
  id: string;
  taskId: string;
  spaceId: string;
  userId: Principal;
  proof: string;
  submittedAt: bigint;
  status: { [key: string]: null };
  reviewerNotes: [] | [string];
  reviewerId: [] | [Principal];
  reviewedAt: [] | [bigint];
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
  creatorId: string;
  maxSubmissions: number;
  currentSubmissions: number;
  requirements: string[];
  visibility: string;
}

interface Submission {
  id: string;
  taskId: string;
  userId: string;
  proof: string;
  submittedAt: number;
  status: string;
  reviewerNotes?: string;
  reviewerId?: string;
  reviewedAt?: number;
}

// Helper functions
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
  creatorId: backendTask.creatorId.toString(),
  maxSubmissions: Number(backendTask.maxSubmissions),
  currentSubmissions: Number(backendTask.currentSubmissions),
  requirements: backendTask.requirements,
  visibility: Object.keys(backendTask.visibility)[0]
});

const transformSubmission = (backendSubmission: BackendSubmission): Submission => ({
  id: backendSubmission.id,
  taskId: backendSubmission.taskId,
  userId: backendSubmission.userId.toString(),
  proof: backendSubmission.proof,
  submittedAt: Number(backendSubmission.submittedAt),
  status: Object.keys(backendSubmission.status)[0],
  reviewerNotes: backendSubmission.reviewerNotes[0],
  reviewerId: backendSubmission.reviewerId[0]?.toString(),
  reviewedAt: backendSubmission.reviewedAt[0] ? Number(backendSubmission.reviewedAt[0]) : undefined
});

export const TaskView = () => {
  const { spaceId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!spaceId || !taskId || !user?.id) return;

      try {
        // Fetch task details
        const taskResult = await desuite_backend.getTask(taskId);
        if ('ok' in taskResult) {
          const transformedTask = transformTask(taskResult.ok);
          setTask(transformedTask);
          setIsAdmin(transformedTask.creatorId === user.id);

          // Fetch user's submission
          const submissionResult = await desuite_backend.getUserTaskSubmission(
            taskId,
            Principal.fromText(user.id)
          );

          if ('ok' in submissionResult) {
            setUserSubmission(transformSubmission(submissionResult.ok));
          }

          // If admin, fetch all task submissions
          if (transformedTask.creatorId === user.id) {
            // Note: You'll need to add this function to your backend
            const allSubmissionsResult = await desuite_backend.getAllTaskSubmissions(taskId);
            if ('ok' in allSubmissionsResult) {
              setSubmissions(allSubmissionsResult.ok.map(transformSubmission));
            }
          }
        } else {
          setError(taskResult.err);
        }
      } catch (err) {
        console.error('Error fetching task data:', err);
        setError('Failed to load task data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [spaceId, taskId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !submissionContent.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await desuite_backend.submitTask(taskId, submissionContent);
      
      if ('ok' in result) {
        setUserSubmission(transformSubmission(result.ok));
        setSubmissionContent('');
      } else {
        setError(result.err);
      }
    } catch (err) {
      console.error('Error submitting task:', err);
      setError('Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (submissionId: string, approved: boolean) => {
    if (!taskId) return;
    
    setIsReviewing(true);
    setError(null);

    try {
      // Note: You'll need to add this function to your backend
      const result = await desuite_backend.reviewTaskSubmission(
        submissionId,
        approved,
        reviewNotes ? [reviewNotes] : []
      );

      if ('ok' in result) {
        const allSubmissionsResult = await desuite_backend.getAllTaskSubmissions(taskId);
        if ('ok' in allSubmissionsResult) {
          setSubmissions(allSubmissionsResult.ok.map(transformSubmission));
        }
        setSelectedSubmission(null);
        setReviewNotes('');
      } else {
        setError(result.err);
      }
    } catch (err) {
      console.error('Error reviewing submission:', err);
      setError('Failed to review submission');
    } finally {
      setIsReviewing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500 mr-2" size={24} />
        <span>Loading task...</span>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Task Not Found</h2>
          <p className="text-gray-400 mb-4">This task might have been removed or doesn't exist.</p>
          <Link
            to={`/spaces/${spaceId}`}
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Back to Space
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Back Button */}
        <Link
          to={`/spaces/${spaceId}`}
          className="inline-flex items-center text-gray-400 hover:text-purple-400 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Space
        </Link>

        {/* Task Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            {task.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className="flex items-center text-purple-400">
              <Award size={18} className="mr-2" />
              {task.points} points
            </span>
            <span className="flex items-center text-gray-400">
              <Clock size={18} className="mr-2" />
              {task.taskType} task
            </span>
            {task.deadline && (
              <span className="flex items-center text-gray-400">
                <Calendar size={18} className="mr-2" />
                Due {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Task Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
            </div>

            {/* Requirements */}
            {task.requirements.length > 0 && (
              <div className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
                <h2 className="text-xl font-bold mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {task.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={20} className="text-purple-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submission Form */}
            {!userSubmission && task.status === 'active' && (
              <div className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
                <h2 className="text-xl font-bold mb-4">Submit Task</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    placeholder="Describe how you completed the task..."
                    required
                  />

                  {error && (
                    <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center">
                      <AlertCircle size={16} className="mr-2" />
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

            {/* User's Submission */}
            {userSubmission && (
              <div className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
                <h2 className="text-xl font-bold mb-4">Your Submission</h2>
                <div className={`p-4 rounded-lg ${
                  userSubmission.status === 'pending'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : userSubmission.status === 'approved'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                } border`}>
                  <div className="flex items-center mb-4">
                    {userSubmission.status === 'pending' ? (
                      <Clock className="text-yellow-400 mr-2" size={20} />
                    ) : userSubmission.status === 'approved' ? (
                      <CheckCircle className="text-green-400 mr-2" size={20} />
                    ) : (
                      <XCircle className="text-red-400 mr-2" size={20} />
                    )}
                    <span className={`font-medium ${
                      userSubmission.status === 'pending'
                        ? 'text-yellow-400'
                        : userSubmission.status === 'approved'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {userSubmission.status === 'pending'
                        ? 'Pending Review'
                        : userSubmission.status === 'approved'
                        ? 'Approved'
                        : 'Rejected'}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap mb-2">
                    {userSubmission.proof}
                  </p>
                  <p className="text-sm text-gray-400">
                    Submitted on {new Date(userSubmission.submittedAt).toLocaleString()}
                  </p>
                  {userSubmission.reviewerNotes && (
                    <div className="mt-4 p-4 rounded-lg bg-black/30 border border-purple-500/20">
                      <p className="text-sm text-gray-400 mb-2">Reviewer Notes:</p>
                      <p className="text-gray-300">{userSubmission.reviewerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Review Panel */}
            {isAdmin && (
              <div className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
                <h2 className="text-xl font-bold mb-4">Submissions ({submissions.length})</h2>
                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No submissions yet</p>
                  ) : (
                    submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className={`p-4 rounded-lg border ${
                          selectedSubmission === submission.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-purple-500/20 hover:border-purple-500/40'
                        } transition-all duration-200`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{submission.userId}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            submission.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : submission.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {submission.status}
                          </span>
                        </div>
                        
                        {submission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setSelectedSubmission(
                                selectedSubmission === submission.id ? null : submission.id
                              )}
                              className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                            >
                              {selectedSubmission === submission.id ? 'Hide details' : 'Review submission'}
                            </button>

                            {selectedSubmission === submission.id && (
                              <div className="mt-4 space-y-4">
                                <div className="p-4 rounded-lg bg-black/30 border border-purple-500/20">
                                  <p className="text-gray-300 whitespace-pre-wrap">
                                    {submission.proof}
                                  </p>
                                </div>

                                <textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Add review notes (optional)"
                                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                  rows={3}
                                />

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReview(submission.id, true)}
                                    disabled={isReviewing}
                                    className="flex-1 py-2 px-4 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-all duration-200 disabled:opacity-50"
                                  >
                                    {isReviewing ? (
                                      <Loader2 className="animate-spin mx-auto" size={18} />
                                    ) : (
                                      'Approve'
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleReview(submission.id, false)}
                                    disabled={isReviewing}
                                    className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all duration-200 disabled:opacity-50"
                                  >
                                    {isReviewing ? (
                                      <Loader2 className="animate-spin mx-auto" size={18} />
                                    ) : (
                                      'Reject'
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {(submission.status === 'approved' || submission.status === 'rejected') && (
                          <div className="mt-2 text-sm">
                            <p className="text-gray-400">
                              Reviewed {submission.reviewedAt ? `on ${new Date(submission.reviewedAt).toLocaleString()}` : ''}
                            </p>
                            {submission.reviewerNotes && (
                              <p className="text-gray-300 mt-2">
                                "{submission.reviewerNotes}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Task Stats */}
            <div className="p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl bg-black/40">
              <h2 className="text-xl font-bold mb-4">Task Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Submissions</span>
                  <span className="font-medium">{submissions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Approved</span>
                  <span className="font-medium text-green-400">
                    {submissions.filter(s => s.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Pending</span>
                  <span className="font-medium text-yellow-400">
                    {submissions.filter(s => s.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Rejected</span>
                  <span className="font-medium text-red-400">
                    {submissions.filter(s => s.status === 'rejected').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};