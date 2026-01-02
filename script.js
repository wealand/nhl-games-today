document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const today = new Date().toISOString().split('T')[0];
    
    const scheduleUrl = `https://api-web.nhle.com/v1/schedule/${today}`;
    const standingsUrl = 'https://api-web.nhle.com/v1/standings/now';

    const fetchData = async () => {
        try {
            const [scheduleResponse, standingsResponse] = await Promise.all([
                fetch(scheduleUrl),
                fetch(standingsUrl)
            ]);

            if (!scheduleResponse.ok) {
                throw new Error(`HTTP error! Schedule status: ${scheduleResponse.status}`);
            }
            if (!standingsResponse.ok) {
                throw new Error(`HTTP error! Standings status: ${standingsResponse.status}`);
            }

            const scheduleData = await scheduleResponse.json();
            const standingsData = await standingsResponse.json();
            
            const standingsMap = new Map(standingsData.standings.map(team => [team.teamAbbrev.default, team]));
            
            const games = scheduleData.gameWeek[0]?.games || [];
            
            renderGames(games, standingsMap);

        } catch (error) {
            console.error("Error fetching game data:", error);
            gameContainer.innerHTML = '<div class="game-card">Could not retrieve game data. Please try again later.</div>';
        }
    };

    const renderGames = (games, standingsMap) => {
        gameContainer.innerHTML = '';

        if (games.length === 0) {
            gameContainer.innerHTML = '<div class="game-card">No NHL games scheduled for today.</div>';
            return;
        }

        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';

            const awayTeamData = game.awayTeam;
            const homeTeamData = game.homeTeam;

            const awayStandings = standingsMap.get(awayTeamData.abbrev);
            const homeStandings = standingsMap.get(homeTeamData.abbrev);
            
            const awayWins = awayStandings?.wins || 0;
            const awayLosses = awayStandings?.losses || 0;
            const awayOtLosses = awayStandings?.otLosses || 0;

            const homeWins = homeStandings?.wins || 0;
            const homeLosses = homeStandings?.losses || 0;
            const homeOtLosses = homeStandings?.otLosses || 0;

            let favoredTeamAnalysis = 'This is expected to be a close match.';
            if (awayWins > homeWins) {
                favoredTeamAnalysis = `${awayTeamData.placeName.default} are favored to win based on their season record.`;
            } else if (homeWins > awayWins) {
                favoredTeamAnalysis = `${homeTeamData.placeName.default} are favored to win based on their season record.`;
            }

            const gameTime = new Date(game.startTimeUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const broadcastInfo = game.tvBroadcasts.map(b => b.network).join(', ');

            gameCard.innerHTML = `
                <div class="game-time">${gameTime}</div>
                <div class="teams">
                    <div class="team">
                        <img src="${awayTeamData.logo}" alt="${awayTeamData.placeName.default}" class="team-logo">
                        <span class="team-name">${awayTeamData.placeName.default}</span>
                        <span class="record">${awayWins}-${awayLosses}-${awayOtLosses}</span>
                        ${awayWins > homeWins ? '<span class="favored">Favored</span>' : ''}
                    </div>
                    <div class="vs">vs</div>
                    <div class="team">
                        <img src="${homeTeamData.logo}" alt="${homeTeamData.placeName.default}" class="team-logo">
                        <span class="team-name">${homeTeamData.placeName.default}</span>
                        <span class="record">${homeWins}-${homeLosses}-${homeOtLosses}</span>
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

    fetchData();
});
