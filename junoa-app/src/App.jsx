import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sun, Moon, User, Users, BookOpen, Home, Heart, MapPin, Clock, Star } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { journalAPI, communityAPI, therapistsAPI, healthCheck } from './services/api';
import SimpleInput from './components/SimpleInput';

// Move page components outside to prevent recreation on every render
const HomePage = ({ journalEntry, setJournalEntry, handleJournalSubmit, journalEntries, setSelectedEntry, isDarkMode, themeStyles }) => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold mb-4">Welcome to Junoa</h2>
      <p className="text-xl opacity-80">A safe space to explore your thoughts and feelings. Start your journey towards self-discovery today.</p>
    </div>

    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-4">Your Journal Entry</h3>
      <textarea
        value={journalEntry}
        onChange={(e) => {
          console.log('📝 Journal textarea input:', e.target.value);
          setJournalEntry(e.target.value);
        }}
        placeholder="What's on your mind today?"
        className={`w-full h-32 p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
      />
      <button
        onClick={handleJournalSubmit}
        className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-500 transition-colors"
      >
        Write your feelings
      </button>
    </div>

    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-4">AI Responses</h3>
      <p className="opacity-80">Our AI companion is here to support you. After you write, you'll receive personalized insights and encouragement.</p>
    </div>

    <div>
      <h3 className="text-2xl font-semibold mb-6">Past Journal Entries</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {journalEntries.slice(0, 3).map((entry) => (
          <div
            key={entry.id}
            onClick={() => setSelectedEntry(entry)}
            className={`rounded-lg border p-4 cursor-pointer hover:shadow-lg transition-shadow ${isDarkMode ? 'bg-dark-green-light border-gray-700' : 'bg-white border-green-200'}`}
          >
            <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg mb-4 flex items-center justify-center">
              <div className="w-20 h-20 bg-amber-300 rounded-full opacity-60"></div>
            </div>
            <p className="text-sm mb-2">{entry.preview}</p>
            <p className="text-xs opacity-60">{entry.date}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const JournalPage = ({ journalEntries, setSelectedEntry, isDarkMode, themeStyles }) => (
  <div className="max-w-4xl mx-auto p-6">
    <h2 className="text-3xl font-bold mb-6">Your Journal</h2>
    
    <div className="grid gap-6">
      {journalEntries.map((entry) => (
        <div
          key={entry.id}
          onClick={() => setSelectedEntry(entry)}
          className={`rounded-lg border p-6 cursor-pointer hover:shadow-lg transition-shadow ${isDarkMode ? 'bg-dark-green-light border-gray-700' : 'bg-white border-green-200'}`}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold">{entry.date}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${
              entry.mood === 'calm' ? 'bg-blue-100 text-blue-800' :
              entry.mood === 'reflective' ? 'bg-purple-100 text-purple-800' :
              'bg-green-100 text-green-800'
            }`}>
              {entry.mood}
            </span>
          </div>
          <p className="opacity-80">{entry.preview}</p>
        </div>
      ))}
    </div>
  </div>
);

const CommunityPage = ({ communityEntries, isDarkMode, themeStyles }) => (
  <div className="max-w-4xl mx-auto p-6">
    <h2 className="text-3xl font-bold mb-6">Community</h2>
    <p className="mb-8 opacity-80">Read and connect with others who are sharing their journeys. Remember, you're not alone in this.</p>
    
    <div className="grid gap-6">
      {communityEntries.map((entry) => (
        <div key={entry.id} className={`rounded-lg border p-6 ${isDarkMode ? 'bg-dark-green-light border-gray-700' : 'bg-white border-green-200'}`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold">{entry.title}</h3>
              <p className="text-sm opacity-60">by {entry.author} • {entry.date}</p>
            </div>
          </div>
          <p className="opacity-80 mb-4">{entry.preview}</p>
          <div className="flex items-center space-x-4 text-sm opacity-60">
            <div className="flex items-center space-x-1">
              <Heart size={16} />
              <span>{entry.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users size={16} />
              <span>{entry.comments} comments</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ResourcesPage = ({ therapists, isDarkMode, themeStyles }) => (
  <div className="max-w-4xl mx-auto p-6">
    <h2 className="text-3xl font-bold mb-6">Resources</h2>
    <p className="mb-8 opacity-80">Find professional support near you. Taking the step to reach out is a sign of strength.</p>
    
    <div className="grid gap-6">
      {therapists.map((therapist) => (
        <div key={therapist.id} className={`rounded-lg border p-6 ${isDarkMode ? 'bg-dark-green-light border-gray-700' : 'bg-white border-green-200'}`}>
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1">{therapist.name}</h3>
              <p className="text-green-600 mb-2">{therapist.specialty}</p>
              <div className="flex items-center space-x-4 text-sm opacity-60 mb-3">
                <div className="flex items-center space-x-1">
                  <MapPin size={16} />
                  <span>{therapist.distance}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star size={16} />
                  <span>{therapist.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>{therapist.availability}</span>
                </div>
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors">
                Contact
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SignupPage = ({ 
  signupName, setSignupName, 
  signupEmail, setSignupEmail, 
  signupPassword, setSignupPassword, 
  signupConfirmPassword, setSignupConfirmPassword,
  handleSignup, setCurrentPage, isDarkMode, loading, error, themeStyles 
}) => (
  <div className="max-w-md mx-auto p-6">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold mb-2">Create Account</h2>
      <p className="opacity-80">Join Junoa and start your journey to better mental health</p>
    </div>

    <form onSubmit={handleSignup} className={`rounded-lg border p-6 ${themeStyles.container}`}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
            type="text"
            value={signupName}
            onChange={(e) => {
              console.log('📝 Signup name input:', e.target.value);
              setSignupName(e.target.value);
            }}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
            placeholder="Enter your full name"
            required
          />
      </div>

              <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
            placeholder="Enter your email"
            required
          />
        </div>

              <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
            placeholder="Create a password"
            required
          />
        </div>

              <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            value={signupConfirmPassword}
            onChange={(e) => setSignupConfirmPassword(e.target.value)}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
            placeholder="Confirm your password"
            required
          />
        </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-500'
        } text-white`}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-center mt-4 text-sm opacity-80">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setCurrentPage('login')}
          className="text-green-500 hover:text-green-400 font-medium"
        >
          Sign in
        </button>
      </p>
    </form>
  </div>
);

const LoginPage = ({ 
  loginEmail, setLoginEmail, 
  loginPassword, setLoginPassword,
  handleLogin, setCurrentPage, isDarkMode, loading, error, themeStyles 
}) => (
  <div className="max-w-md mx-auto p-6">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
      <p className="opacity-80">Sign in to continue your journey</p>
    </div>

    <form onSubmit={handleLogin} className={`rounded-lg border p-6 ${themeStyles.container}`}>
              <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
            placeholder="Enter your email"
            required
          />
        </div>

              <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
            placeholder="Enter your password"
            required
          />
        </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-500'
        } text-white`}
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      <p className="text-center mt-4 text-sm opacity-80">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => setCurrentPage('signup')}
          className="text-green-500 hover:text-green-400 font-medium"
        >
          Sign up
        </button>
      </p>
    </form>
  </div>
);

const ProfilePage = ({ journalEntries, isDarkMode, themeStyles }) => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
      <p className="opacity-80">Manage your account and preferences</p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className={`rounded-lg border p-6 ${isDarkMode ? 'bg-dark-green-light border-gray-700' : 'bg-white border-green-200'}`}>
        <h3 className="text-xl font-semibold mb-4">Account Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              defaultValue="John Doe"
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              defaultValue="john@example.com"
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${themeStyles.input}`}
            />
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors">
            Update Profile
          </button>
        </div>
      </div>

      <div className={`rounded-lg border p-6 ${isDarkMode ? 'bg-dark-green-light border-gray-700' : 'bg-white border-green-200'}`}>
        <h3 className="text-xl font-semibold mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Email notifications</span>
            <input type="checkbox" className="form-checkbox" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span>Daily journal reminders</span>
            <input type="checkbox" className="form-checkbox" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span>Community updates</span>
            <input type="checkbox" className="form-checkbox" />
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors">
            Save Preferences
          </button>
        </div>
      </div>
    </div>

    <div className={`rounded-lg border p-6 mt-6 ${isDarkMode ? 'bg-dark-green-light border-gray-700' : 'bg-white border-green-200'}`}>
      <h3 className="text-xl font-semibold mb-4">Your Journey</h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-500">{journalEntries.length}</div>
          <div className="text-sm opacity-80">Journal Entries</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-500">42</div>
          <div className="text-sm opacity-80">Days Active</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-500">12</div>
          <div className="text-sm opacity-80">Insights Gained</div>
        </div>
      </div>
    </div>
  </div>
);

const EntryModal = ({ entry, onClose, isDarkMode, themeStyles }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className={`rounded-lg border max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 ${isDarkMode ? 'bg-dark-green-light border-gray-700' : 'bg-white border-green-200'}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{entry.date}</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>
      
      <div className="mb-6">
        <h4 className="font-semibold mb-2">Your Entry</h4>
        <p className="whitespace-pre-wrap">{entry.content}</p>
      </div>
      
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-dark-green-lighter' : 'bg-green-50'}`}>
        <h4 className="font-semibold mb-2 text-green-600">AI Companion Response</h4>
        <p className="text-sm">{entry.aiComment}</p>
      </div>
    </div>
  </div>
);

const JunoaApp = () => {
  console.log('🔍 JunoaApp component re-rendering');
  
  // Enable authentication
  const { user, isAuthenticated, login, register, logout, error, clearError } = useAuth();
  
  console.log('🔍 JunoaApp - isAuthenticated:', isAuthenticated, 'user:', user);
  
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [journalEntry, setJournalEntry] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  // Separate state for each form field to prevent object re-renders
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State for API data
  const [journalEntries, setJournalEntries] = useState([]);
  const [communityEntries, setCommunityEntries] = useState([]);
  const [therapists, setTherapists] = useState([]);

  // Memoize theme-dependent styles to prevent re-renders
  const themeStyles = useMemo(() => ({
    input: isDarkMode 
      ? 'bg-dark-green border-gray-600 text-white' 
      : 'bg-white border-green-300',
    container: isDarkMode 
      ? 'bg-dark-green-light border-gray-700' 
      : 'bg-white border-green-200'
  }), [isDarkMode]);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Check password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(signupPassword)) {
      alert('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }
    
    const signupData = {
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword
    };
    
    console.log('📝 Signup form submitted:', signupData);
    
    try {
      setLoading(true);
      console.log('🔄 Calling register function...');
      const result = await register(signupData);
      console.log('✅ Signup result:', result);
      
      if (result.success) {
        setCurrentPage('home');
        alert('Account created successfully!');
        
        // Clear form fields
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
      } else {
        alert(result.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const loginData = {
      email: loginEmail,
      password: loginPassword
    };
    
    console.log('Login form submitted:', loginData);
    
    try {
      setLoading(true);
      const result = await login(loginData);
      console.log('Login result:', result);
      console.log('After login - isAuthenticated:', isAuthenticated, 'user:', user);
      
      if (result.success) {
        setCurrentPage('home');
        alert('Login successful!');
        
        // Clear form fields
        setLoginEmail('');
        setLoginPassword('');
      } else {
        alert(result.message || 'Failed to login');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentPage('home');
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout');
    }
  };



  // Load data when authenticated
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check backend status
        console.log('🔍 Checking backend connection...');
        await healthCheck();
        console.log('✅ Backend connected');
        setBackendStatus('connected');
        
        if (isAuthenticated) {
          // Load journal entries
          const journalData = await journalAPI.getEntries();
          setJournalEntries(journalData.data?.entries || []);
          
          // Load community posts
          const communityData = await communityAPI.getPosts();
          setCommunityEntries(communityData.data?.posts || []);
          
          // Load therapists
          const therapistsData = await therapistsAPI.getTherapists();
          setTherapists(therapistsData.data?.therapists || []);
        }
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        setBackendStatus('disconnected');
      }
    };

    loadData();
  }, [isAuthenticated]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleJournalSubmit = async () => {
    if (!journalEntry.trim()) return;
    
    setLoading(true);
    try {
      console.log('Submitting journal entry:', journalEntry);
      const result = await journalAPI.createEntry({
        content: journalEntry,
        mood: 'reflective',
        tags: ['personal']
      });
      
      console.log('Journal submission result:', result);
      
      if (result.success) {
        setJournalEntries([result.data.entry, ...journalEntries]);
        setJournalEntry('');
        alert('Your journal entry has been saved!');
      } else {
        alert('Failed to save journal entry');
      }
    } catch (error) {
      console.error('Journal submission error:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to save journal entry: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const NavigationBar = () => {
    console.log('🔍 NavigationBar render - isAuthenticated:', isAuthenticated, 'user:', user);
    return (
    <nav className={`${isDarkMode ? 'bg-dark-green text-white' : 'bg-green-50 text-gray-900'} p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-green-200'}`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">✿</div>
          <h1 className="text-xl font-bold">Junoa</h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setCurrentPage('home')}
            className={`hover:text-green-400 transition-colors ${currentPage === 'home' ? 'text-green-400' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentPage('journal')}
            className={`hover:text-green-400 transition-colors ${currentPage === 'journal' ? 'text-green-400' : ''}`}
          >
            Journal
          </button>
          <button 
            onClick={() => setCurrentPage('community')}
            className={`hover:text-green-400 transition-colors ${currentPage === 'community' ? 'text-green-400' : ''}`}
          >
            Community
          </button>
          <button 
            onClick={() => setCurrentPage('resources')}
            className={`hover:text-green-400 transition-colors ${currentPage === 'resources' ? 'text-green-400' : ''}`}
          >
            Resources
          </button>
          
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-green-100'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button 
            onClick={() => {
              if (isAuthenticated) {
                handleLogout();
              } else {
                setCurrentPage('signup');
              }
            }}
            className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
            disabled={loading}
          >
            {isAuthenticated ? 'Log Out' : 'Sign Up'}
          </button>
          
          <button 
            onClick={() => {
              if (isAuthenticated) {
                setCurrentPage('profile');
              } else {
                setCurrentPage('login');
              }
            }}
            className="border border-green-400 px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
            disabled={loading}
          >
            {isAuthenticated ? 'Profile' : 'Log In'}
          </button>
        </div>
      </div>
    </nav>
    );
  };

  const renderCurrentPage = () => {
    console.log('Current page:', currentPage);
    switch(currentPage) {
      case 'home':
        return <HomePage 
          key="home" 
          journalEntry={journalEntry}
          setJournalEntry={setJournalEntry}
          handleJournalSubmit={handleJournalSubmit}
          journalEntries={journalEntries}
          setSelectedEntry={setSelectedEntry}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
        />;
      case 'journal':
        return <JournalPage 
          key="journal" 
          journalEntries={journalEntries}
          setSelectedEntry={setSelectedEntry}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
        />;
      case 'community':
        return <CommunityPage 
          key="community" 
          communityEntries={communityEntries}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
        />;
      case 'resources':
        return <ResourcesPage 
          key="resources" 
          therapists={therapists}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
        />;
      case 'signup':
        return <SignupPage 
          key="signup" 
          signupName={signupName}
          setSignupName={setSignupName}
          signupEmail={signupEmail}
          setSignupEmail={setSignupEmail}
          signupPassword={signupPassword}
          setSignupPassword={setSignupPassword}
          signupConfirmPassword={signupConfirmPassword}
          setSignupConfirmPassword={setSignupConfirmPassword}
          handleSignup={handleSignup}
          setCurrentPage={setCurrentPage}
          isDarkMode={isDarkMode}
          loading={loading}
          error={error}
          themeStyles={themeStyles}
        />;
      case 'login':
        return <LoginPage 
          key="login" 
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          handleLogin={handleLogin}
          setCurrentPage={setCurrentPage}
          isDarkMode={isDarkMode}
          loading={loading}
          error={error}
          themeStyles={themeStyles}
        />;
      case 'profile':
        return <ProfilePage 
          key="profile" 
          journalEntries={journalEntries}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
        />;
      default:
        console.log('Unknown page, defaulting to home');
        return <HomePage 
          key="home" 
          journalEntry={journalEntry}
          setJournalEntry={setJournalEntry}
          handleJournalSubmit={handleJournalSubmit}
          journalEntries={journalEntries}
          setSelectedEntry={setSelectedEntry}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
        />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-dark-green text-white' : 'bg-green-50 text-gray-900'}`}>
      <NavigationBar />
      

      
      <main className="py-8">
        {renderCurrentPage()}
      </main>
      
      {selectedEntry && (
        <EntryModal 
          entry={selectedEntry} 
          onClose={() => setSelectedEntry(null)}
          isDarkMode={isDarkMode}
          themeStyles={themeStyles}
        />
      )}
    </div>
  );
};

export default JunoaApp;