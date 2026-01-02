document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const today = new Date().toISOString().split('T')[0];
    const apiUrl = `https://api-web.nhle.com/v1/schedule/${today}`;

    const fetchGames = async () => {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            renderGames(data.gameWeek[0]?.games || []);
        } catch (error) {
            console.error("Error fetching game data:", error);
            gameContainer.innerHTML = '<div class="game-card">Could not retrieve game data. Please try again later.</div>';
        }
    };

    const renderGames = (games) => {
        // Clear loading message
        gameContainer.innerHTML = '';

        if (games.length === 0) {
            gameContainer.innerHTML = '<div class="game-card">No NHL games scheduled for today.</div>';
            return;
        }

        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';

            const awayTeam = game.awayTeam;
            const homeTeam = game.homeTeam;

            // Determine favored team by comparing wins
            const awayWins = awayTeam.wins || 0;
            const homeWins = homeTeam.wins || 0;
            let favoredTeamAnalysis = 'This is expected to be a close match.';
            if (awayWins > homeWins) {
                favoredTeamAnalysis = `${awayTeam.placeName} is favored to win based on their season record.`;
            } else if (homeWins > awayWins) {
                favoredTeamAnalysis = `${homeTeam.placeName} is favored to win based on their season record.`;
            }

            const gameTime = new Date(game.startTimeUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const broadcastInfo = game.tvBroadcasts.map(b => b.network).join(', ');

            gameCard.innerHTML = `
                <div class="game-time">${gameTime}</div>
                <div class="teams">
                    <div class="team">
                        <img src="${awayTeam.logo}" alt="${awayTeam.placeName}" class="team-logo">
                        <span class="team-name">${awayTeam.placeName}</span>
                        <span class="record">${awayWins}-${awayTeam.losses}-${awayTeam.otLosses}</span>
                        ${awayWins > homeWins ? '<span class="favored">Favored</span>' : ''}
                    </div>
                    <div class="vs">vs</div>
                    <div class="team">
                        <img src="${homeTeam.logo}" alt="${homeTeam.placeName}" class="team-logo">
                        <span class="team-name">${homeTeam.placeName}</span>
                        <span class="record">${homeWins}-${homeTeam.losses}-${homeTeam.otLosses}</span>
                         ${homeWins > awayWins ? '<span class="favored">Favored</span>' : ''}
                    </div>
                </div>
                <div class="analysis">
                    <strong>Analysis:</strong> ${favoredTeamAnalysis}
                </div>
                <div class="broadcast-info">
                    <strong>Broadcast:</strong> ${broadcastInfo || 'N/A'}
                </div>
            `;
            gameContainer.appendChild(gameCard);
        });
    };

    fetchGames();
});
