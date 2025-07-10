import React, { useState } from 'react';
import './GithubProfile.css';

const GithubProfile = () => {
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);

  const fetchUser = async () => {
    if (!username) return;
    const res = await fetch(`https://api.github.com/users/${username}`);
    const data = await res.json();
    setUserData(data);

    if (!data.message) {
      const resRepos = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`);
      const dataRepos = await resRepos.json();
      setRepos(dataRepos);
    } else {
      setRepos([]);
    }
  };

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
        <button onClick={fetchUser}>Search</button>
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
