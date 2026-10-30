/**
 * GitHub API Service — Complete REST API Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoints:
 *   • User Profile:         GET  /user or GET /users/{username}
 *   • User Repositories:    GET  /user/repos or GET /users/{username}/repos
 *   • Activity Feed:        GET  /users/{username}/events
 *   • Open Source Search:   GET  /search/repositories?q={query}
 *   • Star Repo:            PUT  /user/starred/{owner}/{repo}
 *   • Unstar Repo:          DELETE /user/starred/{owner}/{repo}
 *   • Check Starred:        GET  /user/starred/{owner}/{repo}
 *   • Fork Repo:            POST /repos/{owner}/{repo}/forks
 *   • Repo Issues:          GET  /repos/{owner}/{repo}/issues
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 *   • Seamless fallback to public API / cached demo data if token is absent or rate-limited
 *   • Full normalization for DevRepo components
 */

import StorageService from './storageService.js';

const GITHUB_API_BASE = 'https://api.github.com';
const TOKEN_STORAGE_KEY = '@devrepo_github_token';

// GitHub language colors mapping
export const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python:     '#3572A5',
  Java:       '#b07219',
  Kotlin:     '#A97BFF',
  Swift:      '#F05138',
  Rust:       '#dea584',
  Go:         '#00ADD8',
  'C++':      '#f34b7d',
  'C#':       '#178600',
  C:          '#555555',
  Ruby:       '#701516',
  PHP:        '#4F5D95',
  HTML:       '#e34c26',
  CSS:        '#563d7c',
  Dart:       '#00B4AB',
  Shell:      '#89e051',
  Vue:        '#41b883',
  Markdown:   '#083fa1',
};

export function getLanguageColor(language) {
  if (!language) return '#818cf8';
  return LANGUAGE_COLORS[language] || '#818cf8';
}

class GitHubService {
  constructor() {
    this.token = null;
    this.currentUsername = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      const savedToken = await StorageService.getItem(TOKEN_STORAGE_KEY);
      if (savedToken) {
        this.token = savedToken;
      }
    } catch (e) {
      console.warn('Could not restore GitHub token:', e);
    }
    this.initialized = true;
  }

  async setAuthToken(token) {
    this.token = token ? token.trim() : null;
    if (this.token) {
      await StorageService.setItem(TOKEN_STORAGE_KEY, this.token);
    } else {
      await StorageService.removeItem(TOKEN_STORAGE_KEY);
      this.currentUsername = null;
    }
  }

  getAuthToken() {
    return this.token;
  }

  hasToken() {
    return Boolean(this.token && this.token.length > 5);
  }

  getHeaders() {
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    await this.init();
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers || {}),
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return { ok: true, status: 204, data: null };
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorMsg = data?.message || `GitHub API error: ${response.status} ${response.statusText}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return { ok: true, status: response.status, data };
    } catch (error) {
      console.warn(`GitHub API request failed for [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // ─── 1. User Profile ──────────────────────────────────────────────────────────
  async getUserProfile(targetUsername) {
    const userToFetch = targetUsername || this.currentUsername;
    if (!userToFetch && !this.hasToken()) {
      return null;
    }
    let endpoint = '/user';
    if (!this.hasToken()) {
      endpoint = `/users/${userToFetch}`;
    } else if (userToFetch) {
      endpoint = `/users/${userToFetch}`;
    }

    try {
      const res = await this.request(endpoint);
      const data = res.data;
      this.currentUsername = data.login;

      return {
        username: data.login,
        displayName: data.name || data.login,
        avatarUrl: data.avatar_url || `https://github.com/${data.login}.png`,
        avatarInitials: (data.name || data.login).slice(0, 2).toUpperCase(),
        email: data.email || `${data.login}@users.noreply.github.com`,
        bio: data.bio || '',
        totalRepos: (data.public_repos || 0) + (data.total_private_repos || 0),
        publicRepos: data.public_repos || 0,
        followers: data.followers || 0,
        following: data.following || 0,
        location: data.location || '',
        company: data.company || null,
        blog: data.blog || null,
        isAuthenticated: this.hasToken(),
      };
    } catch (e) {
      if (e.status === 404) {
        throw new Error(`Tài khoản GitHub "${userToFetch}" không tồn tại. Vui lòng kiểm tra lại chính xác username!`);
      }
      if (!userToFetch) throw e;
      // If network error/rate limit, keep username and real avatar redirect, NO fake numbers
      return {
        username: userToFetch,
        displayName: userToFetch,
        avatarUrl: `https://github.com/${userToFetch}.png`,
        avatarInitials: userToFetch.slice(0, 2).toUpperCase(),
        email: `${userToFetch}@users.noreply.github.com`,
        bio: '',
        totalRepos: 0,
        publicRepos: 0,
        followers: 0,
        following: 0,
        location: '',
        company: null,
        blog: null,
        isAuthenticated: false,
      };
    }
  }

  // ─── 2. User Repositories ─────────────────────────────────────────────────────
  async getUserRepos(page = 1, perPage = 30) {
    const username = this.currentUsername;
    if (!this.hasToken() && !username) {
      return [];
    }
    let endpoint = `/user/repos?sort=updated&per_page=${perPage}&page=${page}`;
    if (!this.hasToken()) {
      endpoint = `/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`;
    }

    try {
      const res = await this.request(endpoint);
      const rawList = Array.isArray(res.data) ? res.data : [];

      return rawList.map((repo) => this.normalizeRepo(repo));
    } catch (e) {
      console.warn('Failed to fetch repos, returning empty:', e.message);
      return [];
    }
  }

  // ─── 3. Activity Feed (Events) ────────────────────────────────────────────────
  async getUserActivity(username, page = 1, perPage = 20) {
    const targetUser = username || this.currentUsername;
    if (!targetUser) {
      return [];
    }
    const endpoint = `/users/${targetUser}/events/public?per_page=${perPage}&page=${page}`;

    try {
      const res = await this.request(endpoint);
      const rawEvents = Array.isArray(res.data) ? res.data : [];

      return rawEvents.map((event) => this.normalizeEvent(event));
    } catch (e) {
      console.warn('Failed to fetch activity events:', e.message);
      return [];
    }
  }

  // ─── 4. Open Source Repository Search ─────────────────────────────────────────
  async searchRepositories(query = 'react-native', sort = 'stars', page = 1, perPage = 20) {
    const q = query && query.trim().length > 0 ? query.trim() : 'stars:>5000';
    const endpoint = `/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=${perPage}&page=${page}`;

    const res = await this.request(endpoint);
    const data = res.data || {};
    const items = Array.isArray(data.items) ? data.items : [];

    return {
      totalCount: data.total_count || 0,
      items: items.map((repo) => this.normalizeRepo(repo)),
    };
  }

  // ─── 5. Star / Unstar / Check Star ────────────────────────────────────────────
  async starRepository(owner, repo) {
    if (!this.hasToken()) {
      throw new Error('A GitHub Personal Access Token (PAT) is required to star repositories. Please add your token in Settings.');
    }
    const endpoint = `/user/starred/${owner}/${repo}`;
    await this.request(endpoint, {
      method: 'PUT',
      headers: { 'Content-Length': '0' },
    });
    return true;
  }

  async unstarRepository(owner, repo) {
    if (!this.hasToken()) {
      throw new Error('A GitHub Personal Access Token (PAT) is required to unstar repositories.');
    }
    const endpoint = `/user/starred/${owner}/${repo}`;
    await this.request(endpoint, { method: 'DELETE' });
    return false;
  }

  async checkIsStarred(owner, repo) {
    if (!this.hasToken()) return false;
    try {
      const endpoint = `/user/starred/${owner}/${repo}`;
      const res = await this.request(endpoint);
      return res.status === 204;
    } catch {
      return false;
    }
  }

  // ─── 6. Fork Repository ───────────────────────────────────────────────────────
  async forkRepository(owner, repo) {
    if (!this.hasToken()) {
      throw new Error('A GitHub Personal Access Token (PAT) is required to fork repositories. Please add your token in Settings.');
    }
    const endpoint = `/repos/${owner}/${repo}/forks`;
    const res = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return this.normalizeRepo(res.data);
  }

  // ─── 7. Repository Issues / Tasks ─────────────────────────────────────────────
  async getRepoIssues(owner, repo, state = 'open', perPage = 15) {
    const endpoint = `/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}`;
    try {
      const res = await this.request(endpoint);
      const rawIssues = Array.isArray(res.data) ? res.data : [];

      return rawIssues
        .filter((issue) => !issue.pull_request) // filter out PRs
        .map((issue) => ({
          id: String(issue.id),
          number: issue.number,
          title: issue.title,
          repo: `${owner}/${repo}`,
          priority: issue.labels?.some((l) => l.name?.toLowerCase().includes('critical') || l.name?.toLowerCase().includes('bug'))
            ? 'critical'
            : issue.labels?.some((l) => l.name?.toLowerCase().includes('feature') || l.name?.toLowerCase().includes('enhancement'))
            ? 'normal'
            : 'low',
          completed: issue.state === 'closed',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (issue.number % 5 + 1)),
          htmlUrl: issue.html_url,
          author: issue.user?.login,
          commentsCount: issue.comments,
        }));
    } catch (e) {
      console.warn(`Failed to fetch issues for ${owner}/${repo}:`, e.message);
      return [];
    }
  }

  // ─── 8. User Contributions Calendar (GitHub Contribution Graph) ─────────────
  async getUserContributions(username, year = 'all') {
    const userToFetch = username || this.currentUsername;
    if (!userToFetch) {
      return { total: { lastYear: 0 }, contributions: [], years: ['2026', '2025'] };
    }

    try {
      const url = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(userToFetch)}?y=all`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Contribution API responded with HTTP ${response.status}`);
      }
      const data = await response.json();
      const years = Object.keys(data.total || {})
        .filter((y) => y !== 'lastYear')
        .sort((a, b) => Number(b) - Number(a));

      return {
        total: data.total || { lastYear: 0 },
        contributions: data.contributions || [],
        years: years.length > 0 ? years : ['2026', '2025'],
      };
    } catch (err) {
      console.warn(`Could not load contributions for ${userToFetch}:`, err.message);
      return {
        total: { lastYear: 0 },
        contributions: [],
        years: ['2026', '2025'],
      };
    }
  }

  // ─── 9. Repository Contributors ─────────────────────────────────────────────
  async getRepoContributors(owner, repo, perPage = 10) {
    const endpoint = `/repos/${owner}/${repo}/contributors?per_page=${perPage}`;
    try {
      const res = await this.request(endpoint);
      const rawContributors = Array.isArray(res.data) ? res.data : [];
      return rawContributors.map((c) => ({
        id: String(c.id),
        login: c.login,
        avatarUrl: c.avatar_url,
        contributions: c.contributions || 0,
        htmlUrl: c.html_url,
      }));
    } catch (err) {
      console.warn(`Could not load contributors for ${owner}/${repo}:`, err.message);
      return [];
    }
  }

  // ─── 10. GitHub Device Flow (1-Click OAuth without Server) ──────────────────
  async requestDeviceCode(clientId) {
    if (!clientId) throw new Error('Client ID is required for Device Flow');
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://github.com/login/device/code');
    // Direct call with application/json
    try {
      const response = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId.trim(),
          scope: 'repo read:user user:email',
        }),
      });
      return await response.json();
    } catch (e) {
      // Fallback via proxy if CORS blocks in browser
      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId.trim(),
          scope: 'repo read:user user:email',
        }),
      });
      return await res.json();
    }
  }

  // ─── Data Normalizers ─────────────────────────────────────────────────────────
  normalizeRepo(repo) {
    const [ownerLogin] = (repo.full_name || '').split('/');
    const ownerName = repo.owner?.login || ownerLogin || 'owner';

    return {
      id: String(repo.id),
      name: repo.name,
      fullName: repo.full_name || `${ownerName}/${repo.name}`,
      owner: ownerName,
      ownerAvatar: repo.owner?.avatar_url || null,
      description: repo.description || 'No description provided.',
      language: repo.language || 'Markdown',
      languageColor: getLanguageColor(repo.language),
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      openIssues: repo.open_issues_count || 0,
      openTasks: Math.min(repo.open_issues_count || 0, 8),
      openPRs: Math.floor((repo.open_issues_count || 0) / 4),
      branch: repo.default_branch || 'main',
      isPrivate: Boolean(repo.private),
      cloneUrl: repo.clone_url || `https://github.com/${repo.full_name || repo.name}.git`,
      htmlUrl: repo.html_url || `https://github.com/${repo.full_name || repo.name}`,
      lastUpdated: repo.updated_at || new Date().toISOString(),
      topics: repo.topics || [],
      license: repo.license?.spdx_id || repo.license?.name || null,
    };
  }

  normalizeEvent(event) {
    let type = 'push';
    let message = 'Pushed changes';

    const actor = event.actor?.login || 'user';
    const repoName = event.repo?.name || 'repository';

    switch (event.type) {
      case 'PushEvent': {
        type = 'push';
        const count = event.payload?.commits?.length || 1;
        const branch = event.payload?.ref?.replace('refs/heads/', '') || 'main';
        const commitMsg = event.payload?.commits?.[0]?.message || 'updates';
        message = `Pushed ${count} commit${count > 1 ? 's' : ''} to ${branch}: "${commitMsg.slice(0, 50)}"`;
        break;
      }
      case 'PullRequestEvent': {
        type = 'pull_request';
        const action = event.payload?.action || 'opened';
        const prTitle = event.payload?.pull_request?.title || 'Pull Request';
        message = `${action.charAt(0).toUpperCase() + action.slice(1)} PR #${event.payload?.number || ''}: ${prTitle}`;
        break;
      }
      case 'IssuesEvent': {
        type = 'issue';
        const action = event.payload?.action || 'opened';
        const issueTitle = event.payload?.issue?.title || 'Issue';
        message = `${action.charAt(0).toUpperCase() + action.slice(1)} issue #${event.payload?.issue?.number || ''}: ${issueTitle}`;
        break;
      }
      case 'WatchEvent': {
        type = 'star';
        message = `Starred repository ${repoName}`;
        break;
      }
      case 'ForkEvent': {
        type = 'fork';
        message = `Forked repository to ${event.payload?.forkee?.full_name || 'fork'}`;
        break;
      }
      case 'ReleaseEvent': {
        type = 'release';
        message = `Published release ${event.payload?.release?.tag_name || 'v1.0.0'}`;
        break;
      }
      case 'IssueCommentEvent': {
        type = 'comment';
        message = `Commented on issue #${event.payload?.issue?.number || ''}`;
        break;
      }
      default: {
        type = 'push';
        message = `Activity in ${repoName}`;
      }
    }

    return {
      id: String(event.id),
      type,
      actor,
      avatarInitials: actor.slice(0, 2).toUpperCase(),
      avatarUrl: event.actor?.avatar_url || null,
      repo: repoName,
      branch: event.payload?.ref?.replace('refs/heads/', '') || null,
      message,
      timestamp: event.created_at || new Date().toISOString(),
    };
  }
}

export const githubService = new GitHubService();
export default githubService;
