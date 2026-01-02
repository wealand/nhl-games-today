document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');

    const fetchGames = async () => {
        // This is the new, simplified API endpoint from ESPN. No key required.
        const apiUrl = 'http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            renderGames(data.events);

        } catch (error) {
            console.error("Error fetching game data:", error);
            gameContainer.innerHTML = `<div class="game-card">Could not retrieve game data. The API may be unavailable.</div>`;
        }
    };

    const renderGames = (events) => {
        gameContainer.innerHTML = '';

        if (events.length === 0) {
            gameContainer.innerHTML = '<div class="game-card">No NHL games scheduled for today.</div>';
            return;
        }

        events.forEach(event => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';

            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home').team;
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away').team;
            
            const gameTime = new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Extract broadcast info
            let broadcastInfo = 'N/A';
            if (competition.broadcasts && competition.broadcasts.length > 0) {
                broadcastInfo = competition.broadcasts[0].names.join(', ');
            }

            // Extract odds for analysis
            let analysis = "No odds available for this match.";
            if (competition.odds && competition.odds[0]) {
                analysis = `Favored: ${competition.odds[0].details}`;
            }

            gameCard.innerHTML = `
                <div class="game-time">${gameTime}</div>
                <div class="teams">
                    <div class="team">
                        <img src="${awayTeam.logo}" alt="${awayTeam.name}" class="team-logo">
                        <span class="team-name">${awayTeam.name}</span>
                        <span class="record">${(awayTeam.records || [{summary:'0-0-0'}])[0].summary}</span>
                        ${analysis.includes(awayTeam.abbreviation) ? '<span class="favored">Favored</span>' : ''}
                    </div>
                    <div class="vs">vs</div>
                    <div class="team">
                        <img src="${homeTeam.logo}" alt="${homeTeam.name}" class="team-logo">
                        <span class="team-name">${homeTeam.name}</span>
                        <span class="record">${(homeTeam.records || [{summary:'0-0-0'}])[0].summary}</span>
                        ${analysis.includes(homeTeam.abbreviation) ? '<span class="favored">Favored</span>' : ''}
                    </div>
                </div>
                <div class="analysis">
                    <strong>Analysis:</strong> ${analysis}
                </div>
                <div class="broadcast-info">
                    <strong>Broadcast:</strong> ${broadcastInfo}
                </div>
            `;
            gameContainer.appendChild(gameCard);
        });
    };

    fetchGames();
});
