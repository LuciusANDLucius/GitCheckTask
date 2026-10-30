/**
 * GitHubContext — Real State & Task Management Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero fake data. Manages:
 *   • Real User Auth State (GitHub PAT or Guest Mode)
 *   • Real User Repositories & Activities (via GitHub REST API)
 *   • Real User Task Management with Persistent Storage:
 *       - Create task with title, priority, repo association, and deadline
 *       - Today's tasks calculation
 *       - Due date calculation per repository
 *   • Bookmarked Open Source Tracked Repositories
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import githubService from '../services/githubService';
import StorageService from '../services/storageService';

const TASKS_STORAGE_KEY = '@devrepo_tasks';
const TRACKED_REPOS_KEY = '@devrepo_tracked_repos';
const AUTH_STATE_KEY = '@devrepo_auth_state';

const GitHubContext = createContext(null);

export const GitHubProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [trackedRepos, setTrackedRepos] = useState([]);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize data on app startup
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        await githubService.init();

        // 1. Restore persistent user tasks
        const savedTasks = await StorageService.getJSON(TASKS_STORAGE_KEY, []);
        if (Array.isArray(savedTasks)) {
          setTasks(savedTasks);
        }

        // 2. Restore tracked repos
        const savedTracked = await StorageService.getJSON(TRACKED_REPOS_KEY, []);
        if (Array.isArray(savedTracked)) {
          setTrackedRepos(savedTracked);
        }

        // 3. Restore auth state
        const savedAuth = await StorageService.getJSON(AUTH_STATE_KEY, null);
        const savedToken = githubService.getAuthToken();

        if (savedToken) {
          setTokenState(savedToken);
          setIsLoggedIn(true);
          await loadGitHubData();
        } else if (savedAuth && savedAuth.username) {
          githubService.currentUsername = savedAuth.username;
          setIsLoggedIn(true);
          await loadGitHubData(savedAuth.username);
        } else {
          // No token saved — show Login Screen so user can sign in with GitHub
          setIsLoggedIn(false);
          setIsGuest(false);
          setUser(null);
        }
      } catch (err) {
        console.warn('Init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Fetch real data from GitHub API
  const loadGitHubData = async (customUsername) => {
    setError(null);
    try {
      const profile = await githubService.getUserProfile(customUsername);
      if (profile) {
        setUser(profile);
      }

      const userRepos = await githubService.getUserRepos(1, 30);
      setRepos(userRepos || []);

      const userEvents = await githubService.getUserActivity(profile?.username);
      setActivities(userEvents || []);
      return profile;
    } catch (err) {
      console.warn('loadGitHubData error:', err.message);
      setError(err.message);
      throw err;
    }
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadGitHubData(user?.username);
    } catch (err) {
      // Refresh error handled silently or via error state
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // ─── Authentication Handlers ────────────────────────────────────────────────
  const loginWithUsername = useCallback(async (username) => {
    const target = (username || '').trim();
    if (!target) throw new Error('Please enter your GitHub username');
    setLoading(true);
    setError(null);
    try {
      await githubService.setAuthToken(null);
      githubService.currentUsername = target;
      setTokenState(null);
      await loadGitHubData(target);
      setIsLoggedIn(true);
      setIsGuest(false);
      await StorageService.setJSON(AUTH_STATE_KEY, { username: target, isGuest: false });
    } catch (err) {
      setError(err.message || 'Failed to connect with GitHub account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithToken = useCallback(async (newToken) => {
    setLoading(true);
    setError(null);
    try {
      await githubService.setAuthToken(newToken);
      setTokenState(newToken);
      setIsLoggedIn(true);
      setIsGuest(false);
      await StorageService.setJSON(AUTH_STATE_KEY, { isGuest: false });
      await loadGitHubData();
    } catch (err) {
      setError(err.message || 'Failed to authenticate with GitHub token');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAsGuest = useCallback(async () => {
    setIsGuest(true);
    setIsLoggedIn(true);
    setUser({
      username: 'guest',
      displayName: 'Guest Developer',
      avatarUrl: null,
      avatarInitials: 'GD',
      email: 'guest@devrepo.local',
      bio: 'Exploring DevRepo in Guest Mode',
      totalRepos: 0,
      publicRepos: 0,
      followers: 0,
      following: 0,
      isAuthenticated: false,
    });
    setRepos([]);
    setActivities([]);
    await StorageService.setJSON(AUTH_STATE_KEY, { isGuest: true });
  }, []);

  const signOut = useCallback(async () => {
    await githubService.setAuthToken(null);
    githubService.currentUsername = null;
    setTokenState(null);
    setIsLoggedIn(false);
    setIsGuest(false);
    setUser(null);
    setRepos([]);
    setActivities([]);
    await StorageService.removeItem(AUTH_STATE_KEY);
  }, []);

  // ─── Real Task Management with Local Storage Persistence ────────────────────
  const addTask = useCallback(async ({ title, repo, priority = 'normal', dueDate }) => {
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      repo: repo || 'General',
      priority: priority.toLowerCase(), // 'critical' | 'normal' | 'low'
      dueDate: dueDate instanceof Date ? dueDate.toISOString() : (dueDate || new Date().toISOString()),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => {
      const updated = [newTask, ...prev];
      StorageService.setJSON(TASKS_STORAGE_KEY, updated);
      return updated;
    });

    return newTask;
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      StorageService.setJSON(TASKS_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const toggleTask = useCallback(async (taskId) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      StorageService.setJSON(TASKS_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  // ─── Computed Task Categories ───────────────────────────────────────────────
  const { todayTasks, upcomingTasks, overdueTasks, completedTasks } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

    const today = [];
    const upcoming = [];
    const overdue = [];
    const completed = [];

    tasks.forEach((t) => {
      if (t.completed) {
        completed.push(t);
        return;
      }

      const dueTime = new Date(t.dueDate).getTime();
      if (dueTime < startOfToday) {
        overdue.push(t);
      } else if (dueTime >= startOfToday && dueTime <= endOfToday) {
        today.push(t);
      } else {
        upcoming.push(t);
      }
    });

    return {
      todayTasks: today,
      upcomingTasks: upcoming,
      overdueTasks: overdue,
      completedTasks: completed,
    };
  }, [tasks]);

  // Tasks mapped by repository
  const tasksByRepo = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const repoKey = t.repo || 'General';
      if (!map[repoKey]) map[repoKey] = [];
      map[repoKey].push(t);
    });
    return map;
  }, [tasks]);

  // ─── Tracked Repositories (Bookmarks) ───────────────────────────────────────
  const trackRepo = useCallback(async (repo) => {
    setTrackedRepos((prev) => {
      if (prev.some((r) => r.id === repo.id)) return prev;
      const updated = [repo, ...prev];
      StorageService.setJSON(TRACKED_REPOS_KEY, updated);
      return updated;
    });
  }, []);

  const untrackRepo = useCallback(async (repoId) => {
    setTrackedRepos((prev) => {
      const updated = prev.filter((r) => r.id !== repoId);
      StorageService.setJSON(TRACKED_REPOS_KEY, updated);
      return updated;
    });
  }, []);

  const isTracked = useCallback((repoId) => {
    return trackedRepos.some((r) => r.id === repoId);
  }, [trackedRepos]);

  return (
    <GitHubContext.Provider
      value={{
        isLoggedIn,
        isGuest,
        user,
        repos,
        activities,
        tasks,
        todayTasks,
        upcomingTasks,
        overdueTasks,
        completedTasks,
        tasksByRepo,
        trackedRepos,
        token,
        loading,
        refreshing,
        error,
        loginWithUsername,
        loginWithToken,
        loginAsGuest,
        signOut,
        refreshAll,
        addTask,
        deleteTask,
        toggleTask,
        trackRepo,
        untrackRepo,
        isTracked,
      }}
    >
      {children}
    </GitHubContext.Provider>
  );
};

export const useGitHub = () => useContext(GitHubContext);

export default GitHubContext;
