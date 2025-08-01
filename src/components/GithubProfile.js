import React, { useState } from 'react';
import './GithubProfile.css';

const GithubProfile = () => {
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);

  // Metrics
  const [apiCalls, setApiCalls] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMoreRepos, setHasMoreRepos] = useState(false);

  const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  const fetchUser = async (pageNumber = 1, isLoadMore = false) => {
    if (!username) return;

    setTotalRequests(prev => prev + 1);

    if (!isLoadMore) {
      console.log(`Checking cache for username: ${username}`);
      const cached = sessionStorage.getItem(username);
      if (cached) {
        setCacheHits(prev => prev + 1);
        const cachedData = JSON.parse(cached);
        const now = new Date().getTime();
        if (now - cachedData.timestamp < CACHE_EXPIRY) {
          console.log(`Loaded data for ${username} from cache.`);
          setUserData(cachedData.userData);
          setRepos(cachedData.repos);
          setPage(1);
          setHasMoreRepos(cachedData.repos.length === 30);
          return;
        } else {
          console.log('Cache expired for', username);
          sessionStorage.removeItem(username);
        }
      }
    }

    if (!userData || !isLoadMore) {
      setApiCalls(prev => prev + 1);
      console.count("GitHub API Calls");
      console.time("Fetch Time");
      const res = await fetch(`https://api.github.com/users/${username}`);
      const data = await res.json();
      console.timeEnd("Fetch Time");
      setUserData(data);
      if (data.message) return;
    }

    const repoRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&page=${pageNumber}&per_page=30`);
    const repoData = await repoRes.json();

    if (repoData.length < 30) setHasMoreRepos(false);
    else setHasMoreRepos(true);

    setRepos(prev => isLoadMore ? [...prev, ...repoData] : repoData);
    setPage(pageNumber);

    if (!isLoadMore) {
      sessionStorage.setItem(
        username,
        JSON.stringify({
          timestamp: new Date().getTime(),
          userData: userData,
          repos: repoData
        })
      );
    }

    console.log(`Page ${pageNumber} fetched, ${repoData.length} repos`);
  };

  const reduction = totalRequests === 0 ? 0 : ((cacheHits / totalRequests) * 100).toFixed(2);

  return (
    <div className="github-container">
      <h2>GitHub Profile Viewer</h2>

      <div className="search-area">
        <input
          type="text"
          placeholder="Enter GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUser()}
        />
        <button onClick={() => fetchUser()}>Search</button>
      </div>

      <div style={{ marginTop: 20, fontSize: '14px', color: '#444' }}>
        <p>API Calls Made: {apiCalls}</p>
        <p>Cache Hits: {cacheHits}</p>
        <p>Total Requests: {totalRequests}</p>
        <p>API Call Reduction (cache hit %): {reduction}%</p>
      </div>

      {userData && !userData.message && (
        <div className="content-wrapper">
          <aside className="profile">
            <img src={userData.avatar_url} alt="avatar" />
            <h3>{userData.name || userData.login}</h3>
            <p>{userData.bio || "No bio available"}</p>
            <p><strong>Followers:</strong> {userData.followers}</p>
            <p><strong>Following:</strong> {userData.following}</p>
            <p><strong>Public Repos:</strong> {userData.public_repos}</p>
            <p><strong>Location:</strong> {userData.location || "N/A"}</p>
            <a href={userData.html_url} target="_blank" rel="noreferrer">View on GitHub</a>
          </aside>

          <main className="repos">
            <h4>Repositories</h4>
            {repos.length === 0 && <p>No repositories found.</p>}
            <ul>
              {repos.map(repo => (
                <li key={repo.id} className="repo-item">
                  <a href={repo.html_url} target="_blank" rel="noreferrer" className="repo-name">{repo.name}</a>
                  <p className="repo-desc">{repo.description || "No description"}</p>
                  <div className="repo-stats">
                    ⭐ {repo.stargazers_count} &nbsp;|&nbsp; Forks: {repo.forks_count}
                  </div>
                </li>
              ))}
            </ul>

            {hasMoreRepos && (
              <button
                style={{ marginTop: '10px' }}
                onClick={() => fetchUser(page + 1, true)}
              >
                Load More
              </button>
            )}
          </main>
        </div>
      )}

      {userData && userData.message === 'Not Found' && (
        <p className="error">User not found</p>
      )}
    </div>
  );
};

export default GithubProfile;
